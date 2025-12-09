import os, json, asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from rosbag2_py import SequentialReader, StorageOptions, ConverterOptions

UPLOAD_DIR = './ros2_bags'
os.makedirs(UPLOAD_DIR, exist_ok=True)
uploaded_bags = {}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

@app.post('/upload/')
async def upload_ros2_bag(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, 'wb') as f:
        f.write(await file.read())
    uploaded_bags[file.filename] = file_path
    return {'status': 'success', 'filename': file.filename}

@app.delete('/delete/{bag_name}')
async def delete_ros2_bag(bag_name: str):
    if bag_name not in uploaded_bags:
        raise HTTPException(status_code=404, detail='Bag not found')
    os.remove(uploaded_bags[bag_name])
    del uploaded_bags[bag_name]
    return {'status': 'deleted', 'filename': bag_name}

@app.get('/list/')
async def list_ros2_bags():
    return {'bags': list(uploaded_bags.keys())}

@app.get('/stream/{bag_name}')
async def stream_ros2_bag(bag_name: str):
    if bag_name not in uploaded_bags:
        raise HTTPException(status_code=404, detail='Bag not found')
    bag_path = uploaded_bags[bag_name]
    storage_options = StorageOptions(uri=bag_path, storage_id='sqlite3')
    converter_options = ConverterOptions('', '')
    reader = SequentialReader()
    reader.open(storage_options, converter_options)
    data = {'steering': [], 'speed': [], 'yaw_moment': [], 'track': []}
    while reader.has_next():
        topic, msg, t = reader.read_next()
        if topic == '/steering': data['steering'].append(msg.data)
        elif topic == '/speed': data['speed'].append(msg.data)
        elif topic == '/yaw_moment': data['yaw_moment'].append(msg.data)
        elif topic == '/cones': data['track'].append(msg.data)
    return JSONResponse(content=data)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
