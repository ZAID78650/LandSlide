import os

req_path = "/Users/zaidshaikhmohammad/Desktop/LandSlide--main/backend/requirements.txt"
if os.path.exists(req_path):
    with open(req_path, "r") as f:
        content = f.read()
    if "httpx" not in content:
        with open(req_path, "a") as f:
            f.write("\nhttpx==0.27.0\n")
else:
    with open(req_path, "w") as f:
        f.write("httpx==0.27.0\n")

print("requirements updated")
