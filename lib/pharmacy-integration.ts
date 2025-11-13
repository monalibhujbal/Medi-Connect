// Mock pharmacy integration module
// In production, replace with actual API calls to partner pharmacies

interface PharmacyOrderRequest {
  prescriptionId: string
  pharmacyId: string
  patient: {
    name: string
    address: string
    phone: string
  }
  items: Array<{
    name: string
    quantity: number
  }>
}

interface PharmacyOrderResponse {
  orderId: string
  status: "created" | "dispatched" | "failed"
  eta: string // ISO timestamp
  message?: string
}

/**
 * Mock function to create order with partner pharmacy
 * Set SIMULATE_PHARMACY=true in env to enable simulation
 */
export async function createPharmacyOrder(
  request: PharmacyOrderRequest
): Promise<PharmacyOrderResponse> {
  const simulatePharmacy = process.env.SIMULATE_PHARMACY !== "false" // Default to true

  if (!simulatePharmacy) {
    // In production, make actual API call here
    // const response = await fetch(pharmacy.endpointUrl, { ... })
    throw new Error("Real pharmacy integration not implemented")
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate success (90% success rate)
  const success = Math.random() > 0.1

  if (!success) {
    return {
      orderId: `ph_ord_failed_${Date.now()}`,
      status: "failed",
      eta: new Date().toISOString(),
      message: "Pharmacy API temporarily unavailable",
    }
  }

  // Calculate ETA: 24 hours from now
  const eta = new Date()
  eta.setHours(eta.getHours() + 24)

  return {
    orderId: `ph_ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: "created",
    eta: eta.toISOString(),
    message: "Order created successfully. Delivery within 24 hours.",
  }
}

/**
 * Mock function to update order status (called by webhook)
 */
export async function updatePharmacyOrderStatus(
  orderId: string,
  status: "dispatched" | "delivered" | "failed"
): Promise<boolean> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return true
}

