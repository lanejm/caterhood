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
    this._setDescription();
  }
}

///////////////////////////////////////////////////////////
// Application Architecture

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
    // Load the map immediately.
    // If location is available, the map will move to the user's location.
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Add event listeners
    form.addEventListener('submit', this._newCat.bind(this));
    containerCats.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    // Default location: Indianpolis, IN
    // This allows the map to load even when browser location services fail.
    const defaultCoords = [39.7684, -86.1581];

    // Load the map immediately using the default location.
    this._loadMap({
      coords: {
        latitude: defaultCoords[0],
        longitude: defaultCoords[1],
      },
    });

    // Try to get the user's actual location.
    // Failure is intentionally ignored because the map is already loaded.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userCoords = [
            position.coords.latitude,
            position.coords.longitude,
          ];

          // Move the existing map to the user's location.
          if (this.#map) {
            this.#map.setView(userCoords, this.#mapZoomLevel);
          }
        },
        () => {
          // Location unavailable.
          // No alert and no error — the default map remains visible.
          console.log('Location unavailable. Using default map location.');
        }
      );
    }
  }

  _loadMap(position) {
  const { latitude } = position.coords;
  const { longitude } = position.coords;
  const coords = [latitude, longitude];

  this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(this.#map);

  this.#map.on('click', this._showForm.bind(this));

  this.#cats.forEach(cat => {
    this._renderCatMarker(cat);
  });
}

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputNotes.focus();
  }

  _hideForm() {
    inputCoat.value = inputWeight.value = inputNotes.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newCat(e) {
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const weight = inputWeight.value;
    const coatLength = inputCoat.value;

    // Get coordinates from the location clicked on the map
    const { lat, lng } = this.#mapEvent.latlng;

    let cat;

    // If cat is found, create cat object
    if (type === 'found') {
      const notes = inputNotes.value;

      // new FoundCat must have this order to keep notes displaying correctly
      cat = new FoundCat(
        [lat, lng],
        weight,
        coatLength,
        notes
      );
    }

    // Add new object to cats array
    this.#cats.push(cat);

    // Render cat on map as marker
    this._renderCatMarker(cat);

    // Render cat on list
    this._renderCat(cat);

    // Hide the form and clear input fields
    this._hideForm();

    // Save all cats to local storage
    this._setLocalStorage();
  }

  // Popup on map
  _renderCatMarker(cat) {
    console.log(cat);

    L.marker(cat.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          // Change this information below to alter popup style/function
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${cat.type}-popup`,
        })
      )
      .setPopupContent(
        `${cat.type === 'found' ? '🐈' : '🚴‍♀️'} ${cat.description}`
      )
      .openPopup();
  }

  _renderCat(cat) {
    const html = `
      <div class="cat cat--${cat.type}" data-id="${cat.id}">
        <h2 class="cat__title">${cat.description}</h2>
        <div class="cat__details">
          <span class="cat__value">Notes: ${cat.notes}</span>
        </div>
      </div>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const catEl = e.target.closest('.cat');
    if (!catEl) return;

    const cat = this.#cats.find(cat => cat.id === catEl.dataset.id);

    if (!cat) return;

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

    // If the map has already loaded, also restore the marker.
    if (this.#map) {
      this._renderCatMarker(work);
    }
  });
}

  reset() {
    localStorage.removeItem('cats');
    location.reload();
  }
}

const app = new App();
