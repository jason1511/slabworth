export function getBreakdownItems(grade) {
  const breakdown = grade?.breakdown || {};

  return [
    {
      label: "Centering",
      value: breakdown.centering,
      description: "Front border alignment",
    },
    {
      label: "Corners",
      value: breakdown.corners,
      description: "Corner sharpness and whitening",
    },
    {
      label: "Edges",
      value: breakdown.edges,
      description: "Edge wear or chipping",
    },
    {
      label: "Surface",
      value: breakdown.surface,
      description: "Scratches, dents, stains, or glare",
    },
    {
      label: "Back",
      value: breakdown.back,
      description: "Back-side condition",
    },
  ];
}

export function getPhotoQualityTone(rating) {
  const normalizedRating = rating?.toLowerCase() || "";

  if (normalizedRating === "good") {
    return "positive";
  }

  if (normalizedRating === "acceptable") {
    return "neutral";
  }

  return "warning";
}

export function getMatchStatusTone(status) {
  if (status === "confirmed") {
    return "positive";
  }

  return "neutral";
}

export function getWorthGradingRecommendation(result) {
  const score = result?.grade?.score || 0;
  const rarity = result?.detectedCard?.rarity || "";
  const hasDatabaseMatch = Boolean(result?.detectedCard?.databaseId);

  const premiumRarityWords = [
    "Ultra Rare",
    "Secret Rare",
    "Illustration Rare",
    "Special Illustration Rare",
    "Hyper Rare",
    "Promo",
    "Rare",
  ];

  const isPremiumRarity = premiumRarityWords.some((word) =>
    rarity.toLowerCase().includes(word.toLowerCase())
  );

  if (!score || score === 0) {
    return {
      status: "Unable to Decide",
      tone: "neutral",
      reason:
        "The image quality or visible condition is not clear enough to make a grading recommendation.",
    };
  }

  if (!hasDatabaseMatch) {
    return {
      status: "Check Manually",
      tone: "neutral",
      reason:
        "The card was not confidently matched to a database entry, so pricing and rarity should be checked manually first.",
    };
  }

  if (score >= 9 && isPremiumRarity) {
    return {
      status: "Likely Worth Checking",
      tone: "positive",
      reason:
        "The card appears very clean and has a stronger rarity category. Compare raw value against PSA 9 and PSA 10 sold prices before grading.",
    };
  }

  if (score >= 9) {
    return {
      status: "Maybe Worth Checking",
      tone: "neutral",
      reason:
        "The condition looks strong, but the rarity may not justify grading cost. Check PSA 9 and PSA 10 sold prices first.",
    };
  }

  if (score === 8 && isPremiumRarity) {
    return {
      status: "Maybe",
      tone: "neutral",
      reason:
        "The card appears around grade 8 condition. It may be worth grading only if this card has strong graded sale prices.",
    };
  }

  if (score === 8) {
    return {
      status: "Probably Not",
      tone: "warning",
      reason:
        "The card looks decent, but grade 8 results often need a valuable card to justify grading costs.",
    };
  }

  return {
    status: "Not Recommended",
    tone: "warning",
    reason:
      "The visible condition appears below grade 8, so grading may not be cost-effective unless the card is unusually valuable.",
  };
}