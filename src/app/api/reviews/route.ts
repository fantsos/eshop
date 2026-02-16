import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { productId, ...reviewData } = body;
    const data = reviewSchema.parse(reviewData);

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this product" }, { status: 400 });
    }

    const hasOrdered = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: session.user.id, status: "DELIVERED" } },
    });

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: body.images || [],
        isVerified: !!hasOrdered,
      },
    });

    // Update product average rating
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.rating || 0,
        reviewCount: agg._count,
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
