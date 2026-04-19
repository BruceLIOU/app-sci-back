/**
 * IRL (Indice de Référence des Loyers) service
 * INSEE BDM API — OAuth2 client credentials (Consumer Key + Secret).
 * Series: 001762417 — IRL France métropolitaine, ensemble des logements (trimestriel)
 *
 * Variables d'environnement requises :
 *   INSEE_CONSUMER_KEY    — clé consommateur (API Sirene / BDM)
 *   INSEE_CONSUMER_SECRET — secret consommateur
 *   INSEE_IRL_SERIES_ID   — optionnel, défaut : 001762417
 */

const INSEE_TOKEN_URL = "https://api.insee.fr/token";
const IRL_SERIES_ID = process.env.INSEE_IRL_SERIES_ID ?? "001762417";
const INSEE_BDM_URL = `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/${IRL_SERIES_ID}?lastNObservations=8`;

export interface IrlResult {
	period: string;
	value: number;
}

// ─── Token cache ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
	if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

	const key = process.env.INSEE_CONSUMER_KEY;
	const secret = process.env.INSEE_CONSUMER_SECRET;
	if (!key || !secret) {
		throw new Error(
			"Identifiants INSEE manquants (INSEE_CONSUMER_KEY / INSEE_CONSUMER_SECRET)",
		);
	}

	const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
	const res = await fetch(INSEE_TOKEN_URL, {
		method: "POST",
		headers: {
			Authorization: `Basic ${credentials}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`INSEE token error ${res.status}: ${body}`);
	}

	const data = (await res.json()) as {
		access_token: string;
		expires_in: number;
	};
	cachedToken = data.access_token;
	// Expire 1 minute avant l'expiration réelle pour éviter les edge cases
	tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
	return cachedToken;
}

// ─── IRL cache ────────────────────────────────────────────────────────────────

let cachedIrl: IrlResult | null = null;
let irlCacheExpiry = 0;

async function fetchLatestIrl(): Promise<IrlResult> {
	if (cachedIrl && Date.now() < irlCacheExpiry) return cachedIrl;

	try {
		const token = await getAccessToken();
		const res = await fetch(INSEE_BDM_URL, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});
		if (!res.ok) throw new Error(`INSEE BDM error ${res.status}`);

		const json = (await res.json()) as any;

		// SDMX-JSON : liste des périodes dans l'axe temporel
		const periods: string[] =
			json?.structure?.dimensions?.observation?.[0]?.values?.map(
				(v: any) => v.id as string,
			) ?? [];

		// Première série disponible (clé de type "0:0:0:0" — variable selon la série)
		const seriesMap: Record<string, any> = json?.dataSets?.[0]?.series ?? {};
		const firstSeries = Object.values(seriesMap)[0] ?? {};
		const obs: Record<string, any[]> = firstSeries?.observations ?? {};

		let latest: IrlResult | null = null;
		for (const [idx, vals] of Object.entries(obs)) {
			const period = periods[Number(idx)];
			const value = vals[0];
			if (
				period &&
				typeof value === "number" &&
				(!latest || period > latest.period)
			) {
				latest = { period, value };
			}
		}

		if (!latest)
			throw new Error("Aucune valeur IRL trouvée dans la réponse INSEE");

		cachedIrl = latest;
		irlCacheExpiry = Date.now() + 24 * 3600 * 1000; // cache 24h
		return latest;
	} catch (err: any) {
		console.error("[IRL] Erreur récupération INSEE :", err.message);
		// Fallback sur la dernière valeur publiée connue (T1 2025)
		return { period: "2025-Q1", value: 143.51 };
	}
}

// ─── Calcul révision loyer ────────────────────────────────────────────────────

/**
 * Calcule le loyer révisé selon la progression de l'IRL.
 * Formule légale : nouveau_loyer = loyer_actuel × (IRL_nouvel / IRL_référence)
 */
export async function calculateIrlRevision(
	currentRent: number,
	referenceIrl: number,
): Promise<{ newRent: number; currentIrl: IrlResult; variation: number }> {
	const currentIrl = await fetchLatestIrl();
	const variation = (currentIrl.value - referenceIrl) / referenceIrl;
	const newRent =
		Math.round(currentRent * (currentIrl.value / referenceIrl) * 100) / 100;
	return { newRent, currentIrl, variation };
}

export { fetchLatestIrl };
