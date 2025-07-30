"use client";

// Temporary debug component - remove after fixing
export function EnvDebug() {
	return (
		<div className="fixed top-0 right-0 bg-red-100 p-2 text-xs z-[9999] max-w-sm">
			<h3>Env Debug:</h3>
			<p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING"}</p>
			<p>
				SUPABASE_KEY:{" "}
				{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING"}
			</p>
			<p>MAPTILER: {process.env.MAPTILER_API_KEY ? "SET" : "MISSING"}</p>
		</div>
	);
}
