# Data-Compressor

                                     ┌──────────────┐
                                     │   Frontend   │
                                     │ React App    │
                                     └──────┬───────┘
                                            │
          File Metadata                     │
     ┌─────────────────┐                    │
     │ User Uploads 100│─────────API Call──────────►
     │ Files via UI    │         (/upload)          │
     └─────────────────┘                    │       │
                                            ▼       ▼
                                     ┌──────────────┐
                                     │   Backend    │
                                     │ Express.js   │
                                     └──────┬───────┘
                                            │
┌───────────────────┐              ┌────────▼─────────┐
│Kafka Producer in  │              │  Kafka Broker    │
│fileRoutes.js Sends│─────────────►│  Topics:         │
│File Metadata to   │              │  - file-compression
│Kafka              │              │  - file-status-updates
└───────────────────┘              └────────▲─────────┘
                                            │
                                    ┌───────┴───────┐
                                    │Kafka Consumer │
                                    │Processes Files│
                                    └──────┬────────┘
                                           │
                              ┌────────────▼────────────┐
                              │ Compression & Upload to │
                              │ S3 via fileService.js   │
                              └────────────┬────────────┘
                                           │
                               ┌───────────▼────────────┐
                               │ Update Kafka Topic     │
                               │ file-status-updates    │
                               └───────────┬────────────┘
                                           │
                                  Updates Sent to:
                                      Frontend
                                  ┌────────────┐
                                  │ WebSocket  │
                                  └────────────┘
