// PUT    /api/rentals/:id   更新房源（整体替换）
// DELETE /api/rentals/:id   删除房源
//
// 媒体文件存在 Cloudinary，不在本服务的控制范围内；
// 删除房源时只删 D1 行，Cloudinary 上的孤儿媒体可以以后在
// Cloudinary Dashboard 手动清理（25GB 免费额度足够个人用很久）。

function rowToRental(r) {
  if (!r) return null;
  return {
    ...r,
    images: JSON.parse(r.images || "[]"),
    videos: JSON.parse(r.videos || "[]"),
    desc: r.description || "",
  };
}

export async function onRequestPut({ env, request, params }) {
  const id = params.id;
  const body = await request.json();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE rentals SET
      mode=?, title=?, price=?, unitPrice=?, area=?, layout=?, orient=?, addr=?,
      description=?, contact=?, lng=?, lat=?, images=?, videos=?, updatedAt=?
    WHERE id=?
  `).bind(
    body.mode === "buy" ? "buy" : "rent",
    body.title || "", body.price ?? null, body.unitPrice ?? null,
    body.area ?? null, body.layout || "", body.orient || "", body.addr || "",
    body.desc || body.description || "", body.contact || "",
    body.lng, body.lat,
    JSON.stringify(body.images || []), JSON.stringify(body.videos || []),
    now, id
  ).run();
  const row = await env.DB.prepare("SELECT * FROM rentals WHERE id=?").bind(id).first();
  if (!row) return new Response("Not found", { status: 404 });
  return Response.json(rowToRental(row));
}

export async function onRequestDelete({ env, params }) {
  await env.DB.prepare("DELETE FROM rentals WHERE id=?").bind(params.id).run();
  return Response.json({ ok: true });
}
