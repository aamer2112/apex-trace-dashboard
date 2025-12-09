"""
ROS2 Backend for APEXTRACE Telemetry Dashboard
================================================
This Python backend handles ROS2 bag file processing.
Run this externally with: python ros2_backend.py

Required packages:
    pip install fastapi uvicorn python-multipart rosbag2_py rclpy pydantic

Note: This runs separately from the Lovable frontend.
The frontend expects this backend at http://localhost:8000
"""

import os
import json
import asyncio
import shutil
from typing import Dict, List, Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Try to import ROS2 packages (may not be available in all environments)
try:
    from rosbag2_py import SequentialReader, StorageOptions, ConverterOptions
    ROS2_AVAILABLE = True
except ImportError:
    ROS2_AVAILABLE = False
    print("Warning: rosbag2_py not available. Using mock data mode.")

UPLOAD_DIR = './ros2_bags'
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Track uploaded bags with metadata
uploaded_bags: Dict[str, dict] = {}

app = FastAPI(
    title="APEXTRACE ROS2 Backend",
    description="Backend API for ROS2 bag file processing and telemetry streaming",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BagInfo(BaseModel):
    filename: str
    path: str
    size: int
    topics: List[str] = []


class TelemetryData(BaseModel):
    steering: List[float] = []
    speed: List[float] = []
    yaw_moment: List[float] = []
    force: List[float] = []
    track: List[dict] = []
    timestamps: List[float] = []


def scan_existing_bags():
    """Scan upload directory for existing ROS2 bags on startup"""
    global uploaded_bags
    if os.path.exists(UPLOAD_DIR):
        for item in os.listdir(UPLOAD_DIR):
            item_path = os.path.join(UPLOAD_DIR, item)
            if os.path.isdir(item_path) or item.endswith('.db3'):
                uploaded_bags[item] = {
                    'path': item_path,
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0
                }


def extract_telemetry_from_bag(bag_path: str) -> TelemetryData:
    """Extract telemetry data from a ROS2 bag file"""
    data = TelemetryData()
    
    if not ROS2_AVAILABLE:
        # Return mock data if ROS2 is not available
        import random
        import math
        
        num_points = 1000
        for i in range(num_points):
            t = i * 0.01
            data.timestamps.append(t)
            data.steering.append(math.sin(t * 0.5) * 30 + random.uniform(-2, 2))
            data.speed.append(50 + math.sin(t * 0.3) * 20 + random.uniform(-1, 1))
            data.yaw_moment.append(math.cos(t * 0.4) * 500 + random.uniform(-20, 20))
            data.force.append(abs(math.sin(t * 0.6)) * 2000 + random.uniform(-50, 50))
        
        # Mock track data with cones
        for i in range(20):
            data.track.append({
                'type': 'blue_cone',
                'x': i * 5,
                'y': math.sin(i * 0.5) * 3 - 2
            })
            data.track.append({
                'type': 'yellow_cone',
                'x': i * 5,
                'y': math.sin(i * 0.5) * 3 + 2
            })
        
        return data
    
    try:
        storage_options = StorageOptions(uri=bag_path, storage_id='sqlite3')
        converter_options = ConverterOptions('', '')
        reader = SequentialReader()
        reader.open(storage_options, converter_options)
        
        while reader.has_next():
            topic, msg, timestamp = reader.read_next()
            t = timestamp / 1e9  # Convert to seconds
            
            if '/steering' in topic or 'steering' in topic.lower():
                data.steering.append(float(msg.data) if hasattr(msg, 'data') else 0)
                data.timestamps.append(t)
            elif '/speed' in topic or 'velocity' in topic.lower():
                data.speed.append(float(msg.data) if hasattr(msg, 'data') else 0)
            elif '/yaw' in topic or 'yaw_moment' in topic.lower():
                data.yaw_moment.append(float(msg.data) if hasattr(msg, 'data') else 0)
            elif '/force' in topic or 'thrust' in topic.lower():
                data.force.append(float(msg.data) if hasattr(msg, 'data') else 0)
            elif '/cones' in topic or 'track' in topic.lower():
                if hasattr(msg, 'data'):
                    data.track.append({'raw': msg.data})
                    
    except Exception as e:
        print(f"Error reading bag {bag_path}: {e}")
        # Return empty data on error
    
    return data


@app.on_event("startup")
async def startup_event():
    """Scan for existing bags on startup"""
    scan_existing_bags()
    print(f"Found {len(uploaded_bags)} existing ROS2 bags")


@app.post('/upload/')
async def upload_ros2_bag(file: UploadFile = File(...)):
    """Upload a new ROS2 bag file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Create upload directory if needed
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Handle both directory-based bags and single file bags
        content = await file.read()
        
        if file.filename.endswith('.db3'):
            # Single SQLite3 file
            with open(file_path, 'wb') as f:
                f.write(content)
        else:
            # Assume it's a zip/tar of a bag directory
            with open(file_path, 'wb') as f:
                f.write(content)
        
        uploaded_bags[file.filename] = {
            'path': file_path,
            'size': len(content)
        }
        
        return {
            'status': 'success',
            'filename': file.filename,
            'size': len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.delete('/delete/{bag_name}')
async def delete_ros2_bag(bag_name: str):
    """Delete a ROS2 bag file"""
    if bag_name not in uploaded_bags:
        raise HTTPException(status_code=404, detail='Bag not found')
    
    try:
        bag_path = uploaded_bags[bag_name]['path']
        
        if os.path.isdir(bag_path):
            shutil.rmtree(bag_path)
        elif os.path.isfile(bag_path):
            os.remove(bag_path)
        
        del uploaded_bags[bag_name]
        
        return {'status': 'deleted', 'filename': bag_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@app.get('/list/')
async def list_ros2_bags(search: Optional[str] = Query(None)):
    """List all uploaded ROS2 bags with optional search filter"""
    bags = list(uploaded_bags.keys())
    
    if search:
        search_lower = search.lower()
        bags = [b for b in bags if search_lower in b.lower()]
    
    return {
        'bags': bags,
        'total': len(bags),
        'details': {
            name: {
                'size': info.get('size', 0),
                'path': info.get('path', '')
            }
            for name, info in uploaded_bags.items()
            if name in bags
        }
    }


@app.get('/stream/{bag_name}')
async def stream_ros2_bag(bag_name: str):
    """Stream telemetry data from a ROS2 bag"""
    if bag_name not in uploaded_bags:
        raise HTTPException(status_code=404, detail='Bag not found')
    
    bag_path = uploaded_bags[bag_name]['path']
    telemetry = extract_telemetry_from_bag(bag_path)
    
    return JSONResponse(content={
        'steering': telemetry.steering,
        'speed': telemetry.speed,
        'yaw_moment': telemetry.yaw_moment,
        'force': telemetry.force,
        'track': telemetry.track,
        'timestamps': telemetry.timestamps,
        'bag_name': bag_name,
        'total_points': len(telemetry.timestamps)
    })


@app.get('/topics/{bag_name}')
async def get_bag_topics(bag_name: str):
    """Get available topics in a ROS2 bag"""
    if bag_name not in uploaded_bags:
        raise HTTPException(status_code=404, detail='Bag not found')
    
    topics = []
    
    if ROS2_AVAILABLE:
        try:
            bag_path = uploaded_bags[bag_name]['path']
            storage_options = StorageOptions(uri=bag_path, storage_id='sqlite3')
            converter_options = ConverterOptions('', '')
            reader = SequentialReader()
            reader.open(storage_options, converter_options)
            
            topic_types = reader.get_all_topics_and_types()
            topics = [{'name': t.name, 'type': t.type} for t in topic_types]
        except Exception as e:
            print(f"Error reading topics: {e}")
    else:
        # Mock topics
        topics = [
            {'name': '/steering', 'type': 'std_msgs/Float64'},
            {'name': '/speed', 'type': 'std_msgs/Float64'},
            {'name': '/yaw_moment', 'type': 'std_msgs/Float64'},
            {'name': '/force', 'type': 'std_msgs/Float64'},
            {'name': '/cones', 'type': 'custom_msgs/ConeArray'},
        ]
    
    return {'topics': topics, 'bag_name': bag_name}


@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'ros2_available': ROS2_AVAILABLE,
        'bags_loaded': len(uploaded_bags)
    }


if __name__ == '__main__':
    import uvicorn
    print("Starting APEXTRACE ROS2 Backend...")
    print(f"ROS2 Support: {'Available' if ROS2_AVAILABLE else 'Mock Mode'}")
    print(f"Upload Directory: {os.path.abspath(UPLOAD_DIR)}")
    uvicorn.run(app, host='0.0.0.0', port=8000)
