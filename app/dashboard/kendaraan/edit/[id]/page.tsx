import { prisma } from "@/lib/prisma";
import KendaraanForm from "../../kendaraanForm";
import { notFound } from "next/navigation";

export default async function EditKendaraanPage({ params }: { params: { id: string } }) {
  const kendaraan = await prisma.kendaraan.findUnique({
    where: { id_kendaraan: params.id },
  });

  if (!kendaraan) notFound();

  return <KendaraanForm initialData={kendaraan} />;
}