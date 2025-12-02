# APEXTRACE

A web-based telemetry and analysis tool for ROS2 bag files, built with a modern F1-style dashboard interface.

## Overview

APEXTRACE provides automated processing, visualization, and simulation of autonomous vehicle telemetry data. Developed by Abdallah Amer (TUfast Racing Team – Autonomous Systems Subteam).

## Features

- **Automatic ROS2 bag processing** - Upload bags and let the system extract all topics automatically
- **Interactive telemetry plots** - Foxglove-style zoom, pan, and synchronized cursors
- **Simulation playback** - Replay bag data with 2D vehicle visualization
- **Queue management** - Monitor processing status with retry/delete options
- **Aggregate analytics** - Summary statistics across all processed bags

## Demo Mode

The application starts in demo mode with sample bags pre-loaded. Demo users can:

- Upload up to 3 ROS2 bags
- View all telemetry visualizations
- Run simulations
- Access Queue, Admin (read-only), and Summary pages
- Delete demo bags permanently

Demo bags will not reappear once deleted.

## TUfast Admin Login (Optional)

For full admin privileges:

1. Click "TUfast Admin Login" in the sidebar
2. Enter your @tufast.de or @tum.de email
3. Receive and enter the 6-digit verification code
4. Gain full admin access

Admin login is **optional** - demo mode provides full analysis capabilities.

## Uploading ROS2 Bags

### Supported Formats

- ROS2 bag format (`.db3`)
- SQLite3 storage backend
- MCAP storage backend

### Upload Process

1. Click "Upload Bag" in the sidebar
2. Select your bag file(s)
3. Bags are automatically queued for processing
4. Check the Queue page for status

## Plot Interactions

All plots support Foxglove-style interactions:

| Action | Result |
|--------|--------|
| Scroll wheel | Zoom in/out at cursor |
| Drag slider | Pan through time |
| Click + drag | Select zoom range |
| Link button | Sync zoom across plots |
| Reset button | Return to full view |

## Simulation Playback

The Simulation page provides:

- Synchronized replay of telemetry data
- 2D vehicle visualization with steering indicator
- Play/pause controls
- Adjustable speed (0.5x–4x)
- Timeline scrubbing

## Application Pages

| Page | Description |
|------|-------------|
| **Bags** | Main dashboard with quick-look metrics and telemetry plots |
| **Simulation** | Real-time playback with vehicle visualization |
| **Queue** | Processing status for uploaded bags |
| **Admin** | System health and storage metrics |
| **Summary** | Aggregate statistics across all bags |

## Data Export

Export processed data as CSV or Parquet:

1. Select topics in the dashboard
2. Choose time range (optional)
3. Click export button
4. Download the generated file

## File Storage

- Raw bags: Object storage (S3/MinIO)
- Metadata: PostgreSQL database
- Processed data: Parquet files
- Previews: Downsampled JSON for fast loading

## Architecture

Built on modern web technologies:

- **Frontend**: React, Vite, Tailwind CSS, ECharts, Framer Motion
- **Backend**: FastAPI/Node.js with worker queue
- **Storage**: PostgreSQL, S3-compatible object storage
- **Processing**: Docker workers using rbb_core APIs

Inspired by [AMZ Racing's rbb_core](https://github.com/AMZ-Racing/rbb_core) architecture.

## Reporting Issues

For bugs, feature requests, or questions:

1. Contact your TUfast Autonomous Systems technical lead
2. Open an issue on the project repository

## Credits

- **Developer**: Abdallah Amer
- **Team**: TUfast Racing Team – Autonomous Systems Subteam
- **Architecture**: Inspired by AMZ Racing's rbb_core

## Disclaimer

This tool is developed for research and development purposes by the TUfast Autonomous Systems team. Use responsibly and in accordance with your team's data handling policies.
