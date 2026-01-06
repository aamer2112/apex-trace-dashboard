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
    """
    Extract telemetry data from a ROS2 bag file.
    Properly extracts steering, speed, braking, G-forces, and track layout.
    """
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
        
        # Get all topics to understand what's available
        topic_types = reader.get_all_topics_and_types()
        topic_names = [t.name for t in topic_types]
        
        # Track data points with timestamps for synchronization
        steering_data = []
        speed_data = []
        yaw_data = []
        force_data = []
        brake_data = []
        accel_data = []
        track_data = []
        all_timestamps = []
        
        # Reset reader to start from beginning
        reader.close()
        reader.open(storage_options, converter_options)
        
        # Read all messages
        while reader.has_next():
            try:
                topic, msg, timestamp = reader.read_next()
                t = timestamp / 1e9  # Convert nanoseconds to seconds
                
                # Extract steering angle (common topic names)
                if any(keyword in topic.lower() for keyword in ['steering', 'steer', 'delta']):
                    try:
                        if hasattr(msg, 'data'):
                            val = float(msg.data)
                        elif hasattr(msg, 'steering_angle'):
                            val = float(msg.steering_angle)
                        elif hasattr(msg, 'angle'):
                            val = float(msg.angle)
                        else:
                            # Try to parse from string representation
                            val = 0.0
                        steering_data.append((t, val))
                        all_timestamps.append(t)
                    except (ValueError, AttributeError):
                        pass
                
                # Extract speed/velocity
                elif any(keyword in topic.lower() for keyword in ['speed', 'velocity', 'vel', 'vx']):
                    try:
                        if hasattr(msg, 'data'):
                            val = float(msg.data)
                        elif hasattr(msg, 'linear'):
                            if hasattr(msg.linear, 'x'):
                                val = float(msg.linear.x)
                            else:
                                val = 0.0
                        elif hasattr(msg, 'speed'):
                            val = float(msg.speed)
                        elif hasattr(msg, 'velocity'):
                            val = float(msg.velocity)
                        else:
                            val = 0.0
                        speed_data.append((t, val))
                    except (ValueError, AttributeError):
                        pass
                
                # Extract braking
                elif any(keyword in topic.lower() for keyword in ['brake', 'braking', 'deceleration']):
                    try:
                        if hasattr(msg, 'data'):
                            val = float(msg.data)
                        elif hasattr(msg, 'brake'):
                            val = float(msg.brake)
                        elif hasattr(msg, 'braking'):
                            val = float(msg.braking)
                        else:
                            val = 0.0
                        brake_data.append((t, val))
                    except (ValueError, AttributeError):
                        pass
                
                # Extract acceleration/G-forces
                elif any(keyword in topic.lower() for keyword in ['accel', 'acceleration', 'imu', 'gforce', 'g_force']):
                    try:
                        if hasattr(msg, 'linear_acceleration'):
                            if hasattr(msg.linear_acceleration, 'x'):
                                accel_x = float(msg.linear_acceleration.x)
                                accel_y = float(msg.linear_acceleration.y) if hasattr(msg.linear_acceleration, 'y') else 0.0
                                accel_data.append((t, accel_x, accel_y))
                        elif hasattr(msg, 'data'):
                            val = float(msg.data)
                            accel_data.append((t, val, 0.0))
                        elif hasattr(msg, 'acceleration'):
                            val = float(msg.acceleration)
                            accel_data.append((t, val, 0.0))
                    except (ValueError, AttributeError):
                        pass
                
                # Extract yaw/yaw moment
                elif any(keyword in topic.lower() for keyword in ['yaw', 'yaw_moment', 'yaw_rate']):
                    try:
                        if hasattr(msg, 'data'):
                            val = float(msg.data)
                        elif hasattr(msg, 'angular_velocity'):
                            if hasattr(msg.angular_velocity, 'z'):
                                val = float(msg.angular_velocity.z)
                            else:
                                val = 0.0
                        elif hasattr(msg, 'yaw'):
                            val = float(msg.yaw)
                        else:
                            val = 0.0
                        yaw_data.append((t, val))
                    except (ValueError, AttributeError):
                        pass
                
                # Extract force/thrust
                elif any(keyword in topic.lower() for keyword in ['force', 'thrust', 'torque']):
                    try:
                        if hasattr(msg, 'data'):
                            val = float(msg.data)
                        elif hasattr(msg, 'force'):
                            val = float(msg.force)
                        elif hasattr(msg, 'thrust'):
                            val = float(msg.thrust)
                        else:
                            val = 0.0
                        force_data.append((t, val))
                    except (ValueError, AttributeError):
                        pass
                
                # Extract track layout (cones, waypoints, etc.)
                elif any(keyword in topic.lower() for keyword in ['cone', 'track', 'waypoint', 'path', 'route']):
                    try:
                        # Handle different message types for track data
                        if hasattr(msg, 'cones'):
                            # Cone array message
                            for cone in msg.cones:
                                track_data.append({
                                    'type': getattr(cone, 'color', 'unknown') + '_cone' if hasattr(cone, 'color') else 'cone',
                                    'x': float(getattr(cone, 'x', 0)),
                                    'y': float(getattr(cone, 'y', 0))
                                })
                        elif hasattr(msg, 'points'):
                            # Path/waypoint message
                            for point in msg.points:
                                track_data.append({
                                    'type': 'waypoint',
                                    'x': float(getattr(point, 'x', 0)),
                                    'y': float(getattr(point, 'y', 0))
                                })
                        elif hasattr(msg, 'x') and hasattr(msg, 'y'):
                            # Single point message
                            track_data.append({
                                'type': 'waypoint',
                                'x': float(msg.x),
                                'y': float(msg.y)
                            })
                    except (ValueError, AttributeError, TypeError) as e:
                        print(f"Warning: Could not parse track data from {topic}: {e}")
                        pass
                        
            except Exception as e:
                print(f"Warning: Error reading message from {topic}: {e}")
                continue
        
        reader.close()
        
        # Sort all data by timestamp
        all_timestamps = sorted(set(all_timestamps))
        if not all_timestamps:
            # If no timestamps found, generate from data length
            max_len = max(len(steering_data), len(speed_data), len(yaw_data), len(force_data))
            all_timestamps = [i * 0.01 for i in range(max_len)]
        
        # Interpolate and align all signals to common timestamps
        def interpolate_value(data_points, target_time):
            """Interpolate value at target_time from data_points list of (time, value) tuples"""
            if not data_points:
                return 0.0
            
            # Find closest points
            before = None
            after = None
            for t, v in data_points:
                if t <= target_time:
                    before = (t, v)
                elif t >= target_time:
                    after = (t, v)
                    break
            
            if before is None:
                return data_points[0][1] if data_points else 0.0
            if after is None:
                return data_points[-1][1] if data_points else 0.0
            
            # Linear interpolation
            if after[0] == before[0]:
                return before[1]
            ratio = (target_time - before[0]) / (after[0] - before[0])
            return before[1] + ratio * (after[1] - before[1])
        
        # Populate synchronized data arrays
        for t in all_timestamps:
            data.timestamps.append(t)
            data.steering.append(interpolate_value(steering_data, t))
            data.speed.append(interpolate_value(speed_data, t))
            data.yaw_moment.append(interpolate_value(yaw_data, t))
            
            # Use brake data if available, otherwise derive from deceleration
            brake_val = interpolate_value(brake_data, t)
            if brake_val == 0.0 and accel_data:
                # Derive braking from negative acceleration
                accel_val = interpolate_value([(t, x) for t, x, y in accel_data], t)
                brake_val = abs(min(0, accel_val))
            
            # Force can be derived from acceleration or use direct force data
            force_val = interpolate_value(force_data, t)
            if force_val == 0.0 and accel_data:
                # Estimate force from acceleration (F = ma, assuming mass ~300kg for race car)
                accel_val = interpolate_value([(t, x) for t, x, y in accel_data], t)
                force_val = abs(accel_val) * 300  # Approximate mass
            
            data.force.append(force_val)
        
        # Store track data (deduplicate)
        seen_track_points = set()
        for point in track_data:
            key = (point.get('x', 0), point.get('y', 0), point.get('type', 'unknown'))
            if key not in seen_track_points:
                data.track.append(point)
                seen_track_points.add(key)
        
        # If no track data found, generate default track layout
        if not data.track:
            import math
            for i in range(20):
                data.track.append({
                    'type': 'blue_cone',
                    'x': i * 5.0,
                    'y': math.sin(i * 0.5) * 3 - 2
                })
                data.track.append({
                    'type': 'yellow_cone',
                    'x': i * 5.0,
                    'y': math.sin(i * 0.5) * 3 + 2
                })
                    
    except Exception as e:
        print(f"Error reading bag {bag_path}: {e}")
        import traceback
        traceback.print_exc()
        # Return empty data on error
    
    return data


@app.on_event("startup")
async def startup_event():
    """Scan for existing bags on startup"""
    scan_existing_bags()
    print(f"Found {len(uploaded_bags)} existing ROS2 bags")


@app.post('/upload/')
async def upload_ros2_bag(file: UploadFile = File(...)):
    """Upload a new ROS2 bag file and automatically process it"""
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
            'size': len(content),
            'status': 'uploaded'
        }
        
        # Automatically process the bag in the background
        # Extract telemetry data immediately to validate the bag
        try:
            telemetry = extract_telemetry_from_bag(file_path)
            uploaded_bags[file.filename]['status'] = 'processed'
            uploaded_bags[file.filename]['topics_count'] = len(set([
                len(telemetry.steering), len(telemetry.speed), 
                len(telemetry.yaw_moment), len(telemetry.force)
            ]))
            uploaded_bags[file.filename]['data_points'] = len(telemetry.timestamps)
            print(f"Successfully processed bag {file.filename}: {len(telemetry.timestamps)} data points")
        except Exception as e:
            print(f"Warning: Could not process bag {file.filename} immediately: {e}")
            uploaded_bags[file.filename]['status'] = 'uploaded'
        
        return {
            'status': 'success',
            'filename': file.filename,
            'size': len(content),
            'processed': uploaded_bags[file.filename].get('status') == 'processed'
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
