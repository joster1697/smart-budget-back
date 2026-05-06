import Redis from "ioredis";

//Conexion  a Redis
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

export class ExchangeRateService {
  /**   Obtener tipo de cambio entre dos monedas
   * @param from Moneda de origen (ej. 'USD')
   * @param to  Moneda de destino  (ej. 'CRC')
   * @returns Tasa de cambio(multiplicador)
   */
  static async getrate(from: string, to: string): Promise<number> {
    //Si monedas son iguales,multiplicador es 1
    if (from === to) return 1;
    const cacheKey = `exchange_rate:${from}_${to}`;
    //Intenta obtener el valor de cache en Redis para no llamar a la API innecesariamente
    if (redisClient) {
      const cachedRate = await redisClient.get(cacheKey);
      if (cachedRate) {
        console.log(`[Cache] usando tipo de cambio guardado ${from} a ${to}`);
        return parseFloat(cachedRate);
      }
    }

    //Buscar tasas en la API externa
    try {
      console.log(`[API] Buscando tipo de cambio ${from} a ${to}`);
      
      // URL de la API de Open Exchange Rates
      const url = `https://openexchangerates.org/api/latest.json?app_id=${process.env.OER_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al conectar con la API de divisas(OER): ${response.statusText}`);
      }
      
      const exchangeData = await response.json();
      
      let rate;
      // El plan gratuito de Open Exchange Rates solo permite USD como moneda base
      if (exchangeData.base === from) {
        rate = exchangeData.rates[to];
      } else {
        // Si 'from' no es USD, calculamos la tasa cruzada usando USD como intermediario
        const fromRateToUSD = exchangeData.rates[from];
        const toRateToUSD = exchangeData.rates[to];
        
        if (!fromRateToUSD || !toRateToUSD) {
          throw new Error(`Divisa no soportada en la respuesta de OER`);
        }
        
        rate = toRateToUSD / fromRateToUSD;
      }

      //Se guarda el resultado en Redis por 12 horas(43200 segundos)
      if (redisClient && rate) {
        await redisClient.set(cacheKey, rate.toString(), "EX", 43200);
      }
      return rate;
    } catch (error) {
      console.error("ExchangeRateService Error: ", error);
      throw new Error(
        `No se pudo obtener el tipo de cambio de ${from} a ${to}`,
      );
    }
  }
}
