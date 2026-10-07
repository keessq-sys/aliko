/** The limit applies to the complete listing, across R2 and Convex storage. */
export const LISTING_IMAGE_LIMIT = 7;
export function assertListingImageCount(count: number, publishing = false) {
  if (count > LISTING_IMAGE_LIMIT || (publishing && count < 1))
    throw new Error("A published listing requires between 1 and 7 images.");
}
