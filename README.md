CropGuard AI: Explainable Computer Vision for Agricultural Diagnostics



Project Overview

CropGuard is an end-to-end computer vision pipeline developed to identify 16 distinct crop diseases across five major categories (Bean, Cassava, Maize, Potato, and Tomato).



While achieving 86.03% validation accuracy, the core focus of this project is Model Interpretability. By moving beyond "black-box" predictions, CropGuard ensures that AI diagnoses are based on actual biological markers rather than background data leakage.



Technical Architecture

Backbone: Optimized MobileNetV3-Small for low-latency inference on edge devices.



Explainability (XAI): Integrated Grad-CAM (Gradient-weighted Class Activation Mapping) to audit neural network attention zones.



Data Engineering: Developed custom scripts for automated dataset normalization and stratified splitting of heterogeneous data sources.



Advanced Augmentation: Utilized the Albumentations library (Gaussian Noise, Color Jitter) to solve Gradient Saturation and improve real-world robustness.



Deployment: Model served via FastAPI microservice for high-performance REST API interaction.



Repository Structure

📂 data\_engineering

├── The Unified Cassava\_Sorting.py  # Standardizes CSV/JSON labels into directory structures

└── Split\_Script.py           # Logic for stratified train/val/test splitting

📂 training\_pipeline

├── Dependencies\_Installation.ipynb   # Environment orchestration

├── pre\_training\_checklist.md  # Rigorous QA protocols for model stability

└── Datasets\_Training.ipynb       # Architecture definition and training loops

📂 inference\_analysis

└── cropguard\_inference\_v1.ipynb # Grad-CAM visualizations and Root Cause Analysis

requirements.txt               # Documented dependency stack

README.md                      # Project documentation



Engineering Insights: The "Explainability" Audit

A key achievement of this project was identifying why the model produced 100% confidence scores for misclassified images. Through Grad-CAM, I discovered that the model was occasionally focusing on leaf veins rather than disease pustules—a phenomenon known as Gradient Saturation.



Implemented Improvements:



Introduced Color Jitter to force the model to ignore lighting "shortcuts."



Applied a Learning Rate Scheduler (ReduceLROnPlateau) to ensure stable weight convergence during later epochs.



Installation \& Setup

Clone the Repository:



Bash



git clone https://github.com/amara2002/CropGuard-AI.git

cd CropGuard-AI

Install Dependencies:



Bash



pip install -r requirements.txt

Run Inference:

Open inference\_analysis/cropguard\_inference\_v1.ipynb to test the diagnostic engine on your own images.



Future Roadmap (Atoms to Architecture)

Edge Deployment: Porting weights to Raspberry Pi for offline field use.



Synthetic Data: Using GANs to generate rare disease samples to balance the training set.



IoT Integration: Connecting the API to automated irrigation/treatment systems.



Author

Amara Nyei MSc IT Candidate | Data Engineer | Full-Stack Developer

