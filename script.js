'use strict';
class Cat {
  date = new Date();
  id = (Date.now() + Math.random()).toString(36);
  clicks = 0;
  constructor(coords, weight, coatLength) {
    this.coords = coords; // [lat, lng]
    this.weight = weight;
    this.coatLength = coatLength;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class FoundCat extends Cat {
  type = 'found';
  constructor(coords, weight, coatLength, notes) {
    super(coords, weight, coatLength);
    this.notes = notes;
    // this.calcPace();
    this._setDescription();
  }
}

///////////////////////////////////////////////////////////
//Application Architecture

const form = document.querySelector('.form');
const containerCats = document.querySelector('.cats');
const inputType = document.querySelector('.form__input--type');
const inputColor = document.querySelector('.form__input--color');
const inputCoat = document.querySelector('.form__input--coat');
const inputWeight = document.querySelector('.form__input--weight');
const inputNotes = document.querySelector('.form__input--notes');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #cats = [];
  constructor() {
    //get user's position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //add event listeners
    form.addEventListener('submit', this._newCat.bind(this));
    containerCats.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position.');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#cats.forEach(work => {
      this._renderCatMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputCoat.focus();
  }

  _hideForm() {
    inputCoat.value = inputWeight.value = inputNotes.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _newCat(e) {
    e.preventDefault();
    // get data from form
    const type = inputType.value;
    const weight = inputWeight.value;
    const coatLength = inputCoat.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let cat;

    //if cat is found, create cat object
    if (type === 'found') {
      const notes = inputNotes.value;
      cat = new FoundCat([lat, lng], weight, coatLength, notes, type);
    }

    //add new object to workout array
    this.#cats.push(cat);

    //render cat on map as marker
    this._renderCatMarker(cat);

    //render cat on list
    this._renderCat(cat);
    //hide the form and clear input fields.
    this._hideForm();
    //set local storage to all cats
    this._setLocalStorage();
  }

  //popup on map
  _renderCatMarker(cats) {
    L.marker(cats.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          //change this information below to alter popup style/function
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${cats.type}-popup`,
        })
      )
      .setPopupContent(
        `${cats.type === 'found' ? '🐈' : '🚴‍♀️'} ${cats.description}`
      )
      .openPopup();
  }
  _renderCat(cats) {
    let html = `
    <div class="cat cat--${cats.type}" data-id="${cats.id}">
      <h2 class="cat__title">${cats.description}</h2>
      <div class="cat__details">
        <span class="cat__value">Notes: ${cats.notes}</span>
      </div>
      </div>
    `;
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    if (!this.#map) return;

    const catEl = e.target.closest('.cat');
    if (!catEl) return;

    const cat = this.#cats.find(work => work.id === catEl.dataset.id);

    this.#map.setView(cat.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('cats', JSON.stringify(this.#cats));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('cats'));
    if (!data) return;

    this.#cats = data;

    this.#cats.forEach(work => {
      this._renderCat(work);
    });
  }
  reset() {
    localStorage.removeItem('cats');
    location.reload();
  }
}
const app = new App();
