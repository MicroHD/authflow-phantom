import { createHash } from 'crypto';
import { Request } from 'express';

export interface PhantomContext {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
  geoLocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: number;
}

export class ContextEngine {
  static getRequestContext(req: Request): PhantomContext {
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    return {
      ipAddress: this.hashValue(ip),
      userAgent: this.hashValue(userAgent),
      fingerprint: req.headers['x-device-fingerprint'] as string,
      geoLocation: this.extractGeoLocation(req),
      timestamp: Date.now(),
    };
  }

  static matchContext(expected: PhantomContext, actual: PhantomContext): boolean {
    // Must match on device fingerprint if present
    if (expected.fingerprint && expected.fingerprint !== actual.fingerprint) {
      return false;
    }

    // Must match on IP if present
    if (expected.ipAddress && expected.ipAddress !== actual.ipAddress) {
      return false;
    }

    // Must match on user agent if present
    if (expected.userAgent && expected.userAgent !== actual.userAgent) {
      return false;
    }

    // Check geo location if present
    if (expected.geoLocation) {
      if (!actual.geoLocation) return false;
      
      if (expected.geoLocation.country && 
          expected.geoLocation.country !== actual.geoLocation.country) {
        return false;
      }

      if (expected.geoLocation.city && 
          expected.geoLocation.city !== actual.geoLocation.city) {
        return false;
      }

      // Allow some variance in coordinates (e.g., 50km radius)
      if (expected.geoLocation.latitude && expected.geoLocation.longitude) {
        const distance = this.calculateDistance(
          expected.geoLocation.latitude,
          expected.geoLocation.longitude,
          actual.geoLocation.latitude || 0,
          actual.geoLocation.longitude || 0
        );
        if (distance > 50) return false; // 50km radius
      }
    }

    return true;
  }

  private static getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  private static hashValue(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex')
      .slice(0, 16);
  }

  private static extractGeoLocation(req: Request): PhantomContext['geoLocation'] {
    const geo = {
      country: req.headers['cf-ipcountry'] as string,
      city: req.headers['cf-ipcity'] as string,
      latitude: parseFloat(req.headers['cf-latitude'] as string),
      longitude: parseFloat(req.headers['cf-longitude'] as string),
    };

    // Only return if we have at least one valid value
    if (geo.country || geo.city || (!isNaN(geo.latitude) && !isNaN(geo.longitude))) {
      return geo;
    }

    return undefined;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }
} 