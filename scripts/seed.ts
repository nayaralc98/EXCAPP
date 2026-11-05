import { db } from '@/db';
import { albaranes, fichajes, obras, perfiles, users } from '@/db/schema';

if (process.env.TOTALUM_ENV !== 'dev') throw new Error('seed: solo base de datos de desarrollo');

const now = Date.now();
const ago = (h: number) => now - h * 3_600_000;
const d = new Date(now - 900 * 3_600_000);
const gente = [
  { id: 'seed-u1', name: 'Marta Ortega', email: 'marta.ortega@example.com', rol: 'gerente' },
  { id: 'seed-u2', name: 'Javier Molina', email: 'javier.molina@example.com', rol: 'administrativo' },
  { id: 'seed-u3', name: 'Luis Fernández', email: 'luis.fernandez@example.com', rol: 'conductor' },
  { id: 'seed-u4', name: 'Rubén Castaño', email: 'ruben.castano@example.com', rol: 'conductor' },
];
const foto = (w: string) => `https://picsum.photos/seed/${w}/900/1200`;

await db.batch([
  db.insert(users).values(gente.map((p) => ({ id: p.id, name: p.name, email: p.email, emailVerified: true, createdAt: d, updatedAt: d }))).onConflictDoNothing(),
  db.insert(perfiles).values(gente.map((p) => ({ userId: p.id, rol: p.rol, updatedAt: now }))).onConflictDoNothing(),
  db.insert(obras).values([
    { id: 'seed-o1', nombre: 'Urbanización Los Almendros (movimiento de tierras)', cliente: 'Construcciones Ibérica S.L.' },
    { id: 'seed-o2', nombre: 'Variante A-42 tramo 3', cliente: 'Obras Públicas del Sur S.A.' },
  ]).onConflictDoNothing(),
  db.insert(albaranes).values([
    { id: 'seed-a1', fotoUrl: foto('albaran1'), conductorId: 'seed-u3', fechaHora: ago(3), obra: 'Urbanización Los Almendros (movimiento de tierras)', cliente: 'Construcciones Ibérica S.L.', lat: 40.3512, lng: -3.7021, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-a1' },
    { id: 'seed-a2', fotoUrl: foto('albaran2'), conductorId: 'seed-u3', fechaHora: ago(27), obra: 'Variante A-42 tramo 3', cliente: 'Obras Públicas del Sur S.A.', lat: 40.2931, lng: -3.8012, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-a2' },
    { id: 'seed-a3', fotoUrl: foto('albaran3'), conductorId: 'seed-u4', fechaHora: ago(5), obra: 'Variante A-42 tramo 3', cliente: 'Obras Públicas del Sur S.A.', lat: 40.2755, lng: -3.7344, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-a3' },
    { id: 'seed-a4', fotoUrl: foto('albaran4'), conductorId: 'seed-u4', fechaHora: ago(50), obra: 'Urbanización Los Almendros (movimiento de tierras)', cliente: 'Construcciones Ibérica S.L.', lat: null, lng: null, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-a4' },
  ]).onConflictDoNothing(),
  db.insert(fichajes).values([
    { id: 'seed-f1', usuarioId: 'seed-u3', tipo: 'entrada', fechaHora: ago(8), lat: 40.3498, lng: -3.7035, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-f1' },
    { id: 'seed-f2', usuarioId: 'seed-u4', tipo: 'entrada', fechaHora: ago(8.5), lat: 40.2741, lng: -3.7360, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-f2' },
    { id: 'seed-f3', usuarioId: 'seed-u3', tipo: 'salida', fechaHora: ago(24), lat: 40.3505, lng: -3.7019, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-f3' },
    { id: 'seed-f4', usuarioId: 'seed-u4', tipo: 'salida', fechaHora: ago(25), lat: null, lng: null, estadoSync: 'sincronizado', uuidLocal: 'seed-uuid-f4' },
  ]).onConflictDoNothing(),
]);
console.log('seeded');
