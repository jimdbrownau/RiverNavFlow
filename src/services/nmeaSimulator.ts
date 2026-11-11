export interface NMEASentence {
  raw: string;
  type: string;
  timestamp: number;
}

export class NMEAParser {
  // Compute NMEA checksum (XOR of characters between $ and *)
  public static computeChecksum(sentenceWithoutDollarOrStar: string): string {
    let checksum = 0;
    for (let i = 0; i < sentenceWithoutDollarOrStar.length; i++) {
      checksum ^= sentenceWithoutDollarOrStar.charCodeAt(i);
    }
    const hex = checksum.toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  }

  // Format coordinates in NMEA standard (ddmm.mmmm,N/S, dddmm.mmmm,E/W)
  public static toNmeaCoord(val: number, isLat: boolean): { valStr: string; dir: string } {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const minutes = (abs - deg) * 60;
    const degPad = isLat ? 2 : 3;
    const valStr = deg.toString().padStart(degPad, '0') + minutes.toFixed(4).padStart(7, '0');
    return { valStr, dir };
  }

  // Generate real-time standard GPRMC sentence
  public static createRMC(lat: number, lng: number, speedKnots: number, headingDeg: number): string {
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}${now.getUTCSeconds().toString().padStart(2, '0')}.00`;
    const dateStr = `${now.getUTCDate().toString().padStart(2, '0')}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCFullYear().toString().slice(-2)}`;
    
    const latN = this.toNmeaCoord(lat, true);
    const lngN = this.toNmeaCoord(lng, false);

    const body = `GPRMC,${timeStr},A,${latN.valStr},${latN.dir},${lngN.valStr},${lngN.dir},${speedKnots.toFixed(1)},${headingDeg.toFixed(1)},${dateStr},,,A`;
    const checksum = this.computeChecksum(body);
    return `$${body}*${checksum}`;
  }

  // Generate real-time standard SDDPT / SDDBT depth sounder sentence
  public static createDepthSentences(depthFt: number, offsetFt: number = 0.5): { dpt: string; dbt: string } {
    const depthMeters = depthFt * 0.3048;
    const offsetMeters = offsetFt * 0.3048;
    const depthFathoms = depthFt / 6;

    const dptBody = `SDDPT,${depthMeters.toFixed(2)},${offsetMeters.toFixed(2)},100.0`;
    const dpt = `$${dptBody}*${this.computeChecksum(dptBody)}`;

    const dbtBody = `SDDBT,${depthFt.toFixed(1)},f,${depthMeters.toFixed(1)},M,${depthFathoms.toFixed(1)},F`;
    const dbt = `$${dbtBody}*${this.computeChecksum(dbtBody)}`;

    return { dpt, dbt };
  }

  // Generate water temperature sentence
  public static createWaterTempSentence(tempC: number): string {
    const body = `SDMTW,${tempC.toFixed(1)},C`;
    return `$${body}*${this.computeChecksum(body)}`;
  }
}
