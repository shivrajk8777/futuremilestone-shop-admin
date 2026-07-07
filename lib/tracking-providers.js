// Extensible registry of tracking providers
const PROVIDERS = {
  dhl: {
    name: "DHL Express",
    trackingUrl: (id) => `https://www.dhl.com/en/express/tracking.html?AWB=${id}`,
    track: async (id, dispatchTime) => {
      const apiKey = process.env.DHL_API_KEY;

      if (apiKey) {
        try {
          const res = await fetch(`https://api-eu.dhl.com/track/shipments?trackingNumber=${id}`, {
            headers: {
              "API-Key": apiKey,
              "Accept": "application/json"
            }
          });
          if (res.ok) {
            const data = await res.json();
            const shipment = data?.shipments?.[0];
            if (shipment) {
              const statusText = shipment.status?.status || "In Transit";
              const events = (shipment.events || []).map((e) => ({
                timestamp: e.timestamp || new Date().toISOString(),
                location: e.location?.address?.addressLocality || "Facility",
                description: e.description || "Shipment updated"
              }));

              return {
                carrier: "DHL Express",
                trackingId: id,
                status: statusText,
                estimatedDelivery: shipment.estimatedDeliveryDate || undefined,
                checkpoints: events,
                trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${id}`
              };
            }
          }
        } catch (err) {
          console.error("Real DHL API error, falling back to simulation:", err);
        }
      }

      // Simulation fallback: deterministic updates based on elapsed time since dispatch time
      const now = new Date();
      const elapsedMs = now.getTime() - dispatchTime.getTime();
      const elapsedHrs = Math.max(0, elapsedMs / (1000 * 60 * 60));

      const hourMs = 60 * 60 * 1000;
      const allCheckpoints = [
        { delayHrs: 0, location: "MUMBAI - INDIA", description: "Shipment information received", status: "Information Received" },
        { delayHrs: 2, location: "MUMBAI - INDIA", description: "Shipment picked up", status: "In Transit" },
        { delayHrs: 6, location: "MUMBAI - INDIA", description: "Processed at MUMBAI - INDIA", status: "In Transit" },
        { delayHrs: 12, location: "MUMBAI - INDIA", description: "Departed Facility in MUMBAI - INDIA", status: "In Transit" },
        { delayHrs: 20, location: "DUBAI - UAE", description: "Arrived at Sort Facility DUBAI - UAE", status: "In Transit" },
        { delayHrs: 28, location: "LONDON - UK", description: "Arrived at Sort Facility LONDON - UK", status: "In Transit" },
        { delayHrs: 36, location: "LONDON - UK", description: "Arrived at Local Delivery Facility", status: "In Transit" },
        { delayHrs: 42, location: "LONDON - UK", description: "With delivery courier - Out for Delivery", status: "Out for Delivery" },
        { delayHrs: 45, location: "LONDON - UK", description: "Shipment delivered - Signed by Recipient", status: "Delivered" },
      ];

      // Filter checkpoints by current elapsed hours
      const activeEvents = allCheckpoints
        .filter(cp => elapsedHrs >= cp.delayHrs)
        .map(cp => {
          const eventTime = new Date(dispatchTime.getTime() + cp.delayHrs * hourMs);
          return {
            timestamp: eventTime.toISOString(),
            location: cp.location,
            description: cp.description
          };
        });

      // Reverse chronological order for checkpoints display
      const checkpoints = activeEvents.reverse();

      // Current status is the status of the latest event reached
      let currentStatus = "Information Received";
      const reachedCheckpoints = allCheckpoints.filter(cp => elapsedHrs >= cp.delayHrs);
      if (reachedCheckpoints.length > 0) {
        currentStatus = reachedCheckpoints[reachedCheckpoints.length - 1].status;
      }

      // Est delivery is 2 days from dispatch
      const estDeliveryDate = new Date(dispatchTime.getTime() + 48 * hourMs);

      return {
        carrier: "DHL Express",
        trackingId: id,
        status: currentStatus,
        estimatedDelivery: estDeliveryDate.toISOString(),
        checkpoints,
        trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${id}`
      };
    }
  }
};

export async function trackShipment(code, trackingId, dispatchTime) {
  const provider = PROVIDERS[code.toLowerCase()];
  if (!provider) {
    // Return standard fallback if provider is not specifically registered
    return {
      carrier: code || "Standard Carrier",
      trackingId,
      status: "Dispatched",
      checkpoints: [
        {
          timestamp: dispatchTime.toISOString(),
          location: "Warehouse",
          description: `Package handed over to carrier (${code || "Standard Carrier"}). Tracking ID: ${trackingId}`
        }
      ],
      trackingUrl: ""
    };
  }

  return provider.track(trackingId, dispatchTime);
}
