
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(
    title="AutoResolveAI Decision Engine",
    description="AI-powered parts sourcing and service scheduling",
    version="1.0.0"
)


@app.get("/")
def health_check():
    return {
        "success": True,
        "service": "AutoResolveAI Decision Engine",
        "status": "running"
    }


class SourceOption(BaseModel):
    sourceType: str
    sourceId: str
    sourceName: str
    location: str
    availableQuantity: int = Field(ge=0)
    unitPrice: float = Field(ge=0)
    estimatedDeliveryHours: float = Field(ge=0)
    reliabilityScore: float = Field(ge=0, le=100)


class SourcingRequest(BaseModel):
    partUnitPrice: float = Field(gt=0)
    requiredQuantity: int = Field(gt=0)
    options: List[SourceOption]


@app.post("/api/v1/sourcing/rank")
def rank_sourcing_options(request: SourcingRequest):
    try:
        ranked_options = []

        for option in request.options:
            delivery_score = max(
                0,
                100 - option.estimatedDeliveryHours * 5
            )

            cost_score = max(
                0,
                100 - (
                    option.unitPrice /
                    max(request.partUnitPrice, 1)
                ) * 20
            )

            final_score = (
                delivery_score * 0.5
                + cost_score * 0.2
                + option.reliabilityScore * 0.3
            )

            result = option.model_dump()

            result["score"] = round(final_score, 2)

            result["canFulfilEntireQuantity"] = (
                option.availableQuantity >= request.requiredQuantity
            )

            ranked_options.append(result)

        ranked_options.sort(
            key=lambda item: item["score"],
            reverse=True
        )

        remaining_quantity = request.requiredQuantity
        combined_sources = []
        total_cost = 0
        total_allocated_quantity = 0

        for option in ranked_options:
            if remaining_quantity <= 0:
                break

            allocated_quantity = min(
                option["availableQuantity"],
                remaining_quantity
            )

            if allocated_quantity <= 0:
                continue

            estimated_cost = (
                allocated_quantity * option["unitPrice"]
            )

            combined_sources.append({
                **option,
                "allocatedQuantity": allocated_quantity,
                "estimatedCost": round(estimated_cost, 2)
            })

            total_cost += estimated_cost
            total_allocated_quantity += allocated_quantity
            remaining_quantity -= allocated_quantity

        estimated_delivery_hours = max(
            (
                source["estimatedDeliveryHours"]
                for source in combined_sources
            ),
            default=0
        )

        combined_plan = {
            "sources": combined_sources,
            "totalAllocatedQuantity": total_allocated_quantity,
            "totalAvailableQuantity": sum(
                option["availableQuantity"]
                for option in ranked_options
            ),
            "remainingQuantity": remaining_quantity,
            "totalCost": round(total_cost, 2),
            "estimatedDeliveryHours": estimated_delivery_hours,
            "isFulfilled": remaining_quantity == 0
        }

        return {
            "success": True,
            "requiredQuantity": request.requiredQuantity,
            "totalOptions": len(ranked_options),
            "options": ranked_options,
            "combinedPlan": combined_plan
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
