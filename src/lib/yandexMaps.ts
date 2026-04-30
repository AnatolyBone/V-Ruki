let isLoading = false;
let isReady = false;
let promise: Promise<void> | null = null;

export const loadYandexMaps = (): Promise<void> => {
  if (isReady) return Promise.resolve();
  if (isLoading) return promise!;

  isLoading = true;
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

  promise = new Promise((resolve, reject) => {
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
      reject(err);
    };
    document.head.appendChild(script);
  });

  return promise;
};

export const geocodeAddress = async (city: string, address: string): Promise<[number, number] | null> => {
  try {
    await loadYandexMaps();
    // @ts-ignore
    const res = await window.ymaps.geocode(`Россия, ${city}, ${address}`, { results: 1 });
    const firstGeoObject = res.geoObjects.get(0);
    if (firstGeoObject) {
      return firstGeoObject.geometry.getCoordinates();
    }
    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
};
