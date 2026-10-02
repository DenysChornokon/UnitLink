# Armed Forces of Ukraine (AFU) Communication Channels Monitoring Web Application

## Overview

This project is a dedicated web application designed for the real-time monitoring, analysis, and management of military communication channels used by the Armed Forces of Ukraine. Developed in the context of modern full-scale warfare, the system aims to ensure the resilience, efficiency, and security of critical communication networks against intense Electronic Warfare (EW) and physical infrastructure threats.

The theoretical foundation, problem analysis, and architectural requirements for this project are detailed in the accompanying AFU_Communication_Channels_Monitoring_Web_Application.docx file.

## Problem Statement

Modern military operations rely on a heterogeneous mix of communication systems, including:

* **Legacy Systems:** post-Soviet analog and digital radios.

* **NATO Standard Equipment:** advanced tactical radios (e.g., L3Harris) and tactical data links (Link 16).

* **Commercial Off-The-Shelf (COTS):** DMR radios (Motorola MOTOTRBO), broadband routers (Ubiquiti, MikroTik), and satellite terminals (Starlink).

This diverse ecosystem faces unprecedented challenges, primarily from sophisticated adversarial Electronic Warfare (EW) complexes (e.g., "Zhitel," "Krasukha," "Leer-3") that execute jamming, spoofing, and interception. This web application addresses the critical need for a centralized, intelligent monitoring system to detect anomalies, track performance, and maintain Command and Control (C2) continuity.

## Core Features

The application provides a comprehensive Network Operations Center (NOC) dashboard tailored for tactical and operational environments:

### 1. Real-Time Performance & Reliability Metrics

* **Throughput & Utilization:** monitor bandwidth, CPU, and memory loads of network nodes.

* **Quality of Service (QoS):** track Latency, Jitter, Packet Loss, and Error Rates crucial for voice and video C2 channels.

* **Uptime Tracking:** calculate Mean Time Between Failures (MTBF) and overall channel availability.

### 2. Radio & Satellite Channel Monitoring

* **Signal Diagnostics:** real-time tracking of Signal Strength and Signal-to-Noise Ratio (SNR).

* **Interference Detection:** monitor elevated noise floors indicating potential EW jamming attempts.

### 3. Security & Anomaly Detection (AI/ML Ready)

* Integrates capabilities for anomaly detection using Machine Learning (e.g., Autoencoders, LSTM) to identify irregular network behavior, unknown devices, or spoofing attacks.

* Encryption status monitoring to ensure data confidentiality.

### 4. Interoperability & Network Topology

* Visualizes complex, heterogeneous networks, supporting the integration of Software-Defined Networking (SDN) and Mobile Ad-hoc Networks (MANET).

* Assists in bridging the gap between COTS solutions and military-grade (Mil-Spec) networks.

## Technology Stack (Proposed)

* **Frontend:** React.js / Vue.js (for dynamic, real-time dashboard visualization)

* **Backend:** Python (FastAPI / Django) or Node.js

* **Database:** PostgreSQL (for relational data) / Time-Series Database like Prometheus or InfluxDB (for metrics)

* **Monitoring Protocols:** SNMP, Syslog, NetFlow, and custom API integrations for COTS/GOTS equipment.

* **Advanced Analytics:** Python (TensorFlow/PyTorch) for machine learning anomaly detection models.

## Strategic Importance

By implementing this monitoring application, command centers gain enhanced situational awareness, enabling them to:

* Proactively route traffic around jammed or destroyed nodes.

* Identify and mitigate the thermal and RF signatures of active terminals (like Starlink).

* Enhance overall survivability and interoperability of units operating under NATO and hybrid standards.

## Documentation Reference

For an in-depth exploration of the military communication landscape, EW threats, and the scientific justification for this software, please refer to the primary research document: AFU_Communication_Channels_Monitoring_Web_Application**.docx**.