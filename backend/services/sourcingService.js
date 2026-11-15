const Inventory = require("../models/Inventory");
const VendorInventory = require("../models/VendorInventory");
const Part = require("../models/Parts");

const findSourceOptions = async (dealershipId, partId, requiredQuantity) => {
  const part = await Part.findById(partId);

  if (!part) {
    throw new Error("Part not found");
  }

  const sisterStock = await Inventory.find({
    part: partId,
    dealership: { $ne: dealershipId },
  }).populate("dealership");

  const vendorStock = await VendorInventory.find({
    part: partId,
    isAvailable: true,
    availableQuantity: { $gt: 0 },
  }).populate("vendor");

  const options = [];

  for (const stock of sisterStock) {
    const availableQuantity = Math.max(
      0,
      stock.quantity - stock.reservedQuantity
    );

    if (availableQuantity <= 0) continue;

    options.push({
      sourceType: "Sister Dealership",
      sourceId: stock.dealership._id,
      sourceName: stock.dealership.name,
      location: `${stock.dealership.location.city}, ${stock.dealership.location.state}`,
      availableQuantity,
      unitPrice: part.unitPrice,
      estimatedDeliveryHours: 2,
      reliabilityScore: 90,
    });
  }

  for (const stock of vendorStock) {
    options.push({
      sourceType: "Vendor",
      sourceId: stock.vendor._id,
      sourceName: stock.vendor.name,
      location: `${stock.vendor.address.city}, ${stock.vendor.address.state}`,
      availableQuantity: stock.availableQuantity,
      unitPrice: stock.unitPrice,
      estimatedDeliveryHours: stock.estimatedDeliveryHours,
      reliabilityScore: stock.vendor.reliabilityScore,
    });
  }

  const rankedOptions = options.map((option) => {
    const deliveryScore = Math.max(
      0,
      100 - option.estimatedDeliveryHours * 5
    );

    const costScore = Math.max(
      0,
      100 - (option.unitPrice / Math.max(part.unitPrice, 1)) * 20
    );

    const score =
      deliveryScore * 0.5 +
      costScore * 0.2 +
      option.reliabilityScore * 0.3;

    return {
      ...option,
      score: Number(score.toFixed(2)),
      canFulfilEntireQuantity:
        option.availableQuantity >= requiredQuantity,
    };
  });

  rankedOptions.sort((a, b) => b.score - a.score);

  return {
    part: {
      id: part._id,
      partNumber: part.partNumber,
      name: part.name,
    },
    requiredQuantity,
    options: rankedOptions,
  };
};

module.exports = { findSourceOptions };