import type { NextApiRequest, NextApiResponse } from "next";
import { listarCandidatos } from "@/lib/revisao";

// Assuntos errados uma vez só, que não entram na Revisão sozinhos mas podem ser incluídos.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  res.status(200).json(await listarCandidatos());
}
