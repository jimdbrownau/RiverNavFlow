import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Waypoint, RouteTrack } from '../types/marine';
import { AdminUser, DownloadAuditEntry } from '../types/admin';

export class FirestoreSyncService {
  /**
   * Sync a user's waypoint to Firestore under /users/{userId}/waypoints/{waypointId}
   */
  public static async saveWaypoint(waypoint: Waypoint): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/waypoints/${waypoint.id}`;
    try {
      const payload: any = {
        id: waypoint.id,
        userId: user.uid,
        name: waypoint.name.substring(0, 100),
        category: waypoint.category,
        lat: Number(waypoint.lat),
        lng: Number(waypoint.lng),
        createdAt: waypoint.createdAt || Date.now(),
      };
      if (waypoint.depthFt !== undefined) payload.depthFt = Number(waypoint.depthFt);
      if (waypoint.notes) payload.notes = waypoint.notes.substring(0, 500);

      await setDoc(doc(db, 'users', user.uid, 'waypoints', waypoint.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Delete a waypoint from Firestore
   */
  public static async deleteWaypoint(waypointId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/waypoints/${waypointId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'waypoints', waypointId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Fetch all cloud-synced waypoints for the current user
   */
  public static async fetchWaypoints(): Promise<Waypoint[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const path = `users/${user.uid}/waypoints`;
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'waypoints'));
      const waypoints: Waypoint[] = [];
      snap.forEach(d => {
        const data = d.data();
        waypoints.push({
          id: data.id || d.id,
          name: data.name,
          category: data.category,
          lat: data.lat,
          lng: data.lng,
          depthFt: data.depthFt,
          notes: data.notes,
          createdAt: data.createdAt,
        });
      });
      return waypoints;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Sync a recorded route to Firestore under /users/{userId}/routes/{routeId}
   */
  public static async saveRoute(route: RouteTrack | any): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/routes/${route.id}`;
    try {
      const payload: any = {
        id: route.id,
        userId: user.uid,
        name: route.name.substring(0, 120),
        riverName: (route.riverName || 'Columbia River').substring(0, 100),
        distanceNm: Number(route.distanceNm || 0),
        durationSec: Number(route.durationSec || 0),
        createdAt: route.createdAt || Date.now(),
      };
      if (route.points) payload.pointsCount = route.points.length;
      if (route.maxSpeedKnots) payload.maxSpeedKnots = Number(route.maxSpeedKnots);
      if (route.avgDepthFt) payload.avgDepthFt = Number(route.avgDepthFt);
      if (route.minDepthFt) payload.minDepthFt = Number(route.minDepthFt);

      await setDoc(doc(db, 'users', user.uid, 'routes', route.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Delete a route from Firestore
   */
  public static async deleteRoute(routeId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `users/${user.uid}/routes/${routeId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'routes', routeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Publish current vessel live telemetry to /fleet_vessels/{vesselId}
   */
  public static async updateFleetVesselTelemetry(
    lat: number,
    lng: number,
    vesselName: string,
    riverName: string,
    speedKnots: number = 0,
    headingDeg: number = 0
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const vesselId = user.uid;
    const path = `fleet_vessels/${vesselId}`;
    try {
      const payload: any = {
        id: vesselId,
        userId: user.uid,
        vesselName: vesselName.substring(0, 80),
        skipperName: (user.displayName || 'Vessel Skipper').substring(0, 80),
        lat: Number(lat),
        lng: Number(lng),
        riverName: riverName.substring(0, 100),
        speedKnots: Number(speedKnots),
        headingDeg: Number(headingDeg),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'fleet_vessels', vesselId), payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Record a download audit entry into /download_audit_logs/{logId}
   */
  public static async recordDownloadLog(entry: DownloadAuditEntry): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const path = `download_audit_logs/${entry.id}`;
    try {
      const payload = {
        id: entry.id,
        userId: user.uid,
        userName: (entry.userName || user.displayName || 'Mariner').substring(0, 80),
        packName: entry.packName.substring(0, 120),
        riverName: entry.riverName.substring(0, 80),
        packSizeMb: Number(entry.packSizeMb),
        timestamp: entry.timestamp || Date.now(),
        status: entry.status,
      };

      await setDoc(doc(db, 'download_audit_logs', entry.id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
