import type { NextApiRequest, NextApiResponse } from "next";
import { resumoRevisao } from "@/lib/revisao";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  res.status(200).json(await resumoRevisao());
}
