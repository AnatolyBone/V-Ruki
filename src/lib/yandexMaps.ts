let isLoading = false;
let isReady = false;
let promise: Promise<void> | null = null;

export const loadYandexMaps = (): Promise<void> => {
  if (isReady) return Promise.resolve();
  if (isLoading && promise) return promise;

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Yandex Maps API key is missing');
    return Promise.reject(new Error('Yandex Maps API key is missing'));
  }

  isLoading = true;

  promise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src*="api-maps.yandex.ru"]'
    );

    if (existingScript) {
      // @ts-ignore
      window.ymaps.ready(() => {
        isReady = true;
        isLoading = false;
        resolve();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.type = 'text/javascript';

    script.onload = () => {
      // @ts-ignore
      window.ymaps.ready(() => {
        isReady = true;
        isLoading = false;
        resolve();
      });
    };

    script.onerror = (err) => {
      isLoading = false;
      promise = null;
      console.error('Yandex Maps load error:', err);
      reject(err);
    };

    document.head.appendChild(script);
  });

  return promise;
};

export const geocodeAddress = async (
  city: string,
  address: string
): Promise<[number, number] | null> => {
  try {
    await loadYandexMaps();

    if (!city || !address) return null;

    const query = `Россия, ${city}, ${address}`;

    // @ts-ignore
    const res = await window.ymaps.geocode(query, { results: 1 });
    const firstGeoObject = res.geoObjects.get(0);

    if (!firstGeoObject) return null;

    return firstGeoObject.geometry.getCoordinates();
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
};
