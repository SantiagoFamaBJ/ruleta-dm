import RuletaApp from '../components/RuletaApp';
import { loadConfig } from '../lib/db';

// Se lee la config (textos y premios) en cada visita, así los cambios del admin se ven al recargar.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const config = await loadConfig();
  return <RuletaApp config={config} />;
}
