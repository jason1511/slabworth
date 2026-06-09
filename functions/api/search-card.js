import {
  buildMarketLinks,
  searchAllCardDatabases,
} from "../utils/card-search.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const name = body.name?.trim() || "";
    const number = body.number?.trim() || "";

    if (!name && !number) {
      return Response.json(
        {
          success: false,
          message: "Please enter a card name or card number.",
        },
        { status: 400 }
      );
    }

    const detectedCard = {
      name,
      number,
      set: "",
    };

    const matches = await searchAllCardDatabases(detectedCard);

    return Response.json({
      success: true,
      matches,
      links: buildMarketLinks(detectedCard),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while searching the card database.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function onRequestGet() {
  return Response.json({
    success: true,
    message: "SlabWorth manual card search API is running.",
  });
}