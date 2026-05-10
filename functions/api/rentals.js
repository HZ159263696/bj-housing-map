// GET  /api/rentals?mode=rent|buy   列出当前模式所有房源
// POST /api/rentals                  新建房源（body 是 JSON）

function rowToRental(r) {
  if (!r) return null;
  return {
    ...r,
    images: JSON.parse(r.images || "[]"),
    videos: JSON.parse(r.videos || "[]"),
    desc: r.description || "",
  };
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "buy" ? "buy" : "rent";
  const { results } = await env.DB.prepare(
    "SELECT * FROM rentals WHERE mode = ? ORDER BY createdAt ASC"
  ).bind(mode).all();
  return Response.json((results || []).map(rowToRental));
}

export async function onRequestPost({ env, request }) {
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const mode = body.mode === "buy" ? "buy" : "rent";

  await env.DB.prepare(`
    INSERT INTO rentals
      (id, mode, title, price, unitPrice, area, layout, orient, addr, description, contact, lng, lat, images, videos, createdAt, updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      mode=excluded.mode, title=excluded.title, price=excluded.price, unitPrice=excluded.unitPrice,
      area=excluded.area, layout=excluded.layout, orient=excluded.orient, addr=excluded.addr,
      description=excluded.description, contact=excluded.contact, lng=excluded.lng, lat=excluded.lat,
      images=excluded.images, videos=excluded.videos, updatedAt=excluded.updatedAt
  `).bind(
    id, mode,
    body.title || "", body.price ?? null, body.unitPrice ?? null,
    body.area ?? null, body.layout || "", body.orient || "", body.addr || "",
    body.desc || body.description || "", body.contact || "",
    body.lng, body.lat,
    JSON.stringify(body.images || []), JSON.stringify(body.videos || []),
    body.createdAt || now, now
  ).run();

  const row = await env.DB.prepare("SELECT * FROM rentals WHERE id=?").bind(id).first();
  return Response.json(rowToRental(row));
}
