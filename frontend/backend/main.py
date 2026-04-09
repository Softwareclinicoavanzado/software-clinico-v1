import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app) # Fundamental para que el frontend pueda hablar con el backend

# Configuración de Supabase con tus credenciales reales
SUPABASE_URL = "https://klaygjvawybfksmahbhd.supabase.co"
SUPABASE_KEY = "sb_publishable_ZoyBvw_JncKIesGmjEpEuA_dSIZZV4Z"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/')
def home():
    return jsonify({"status": "online", "message": "ClinicOS Backend Running"})

# --- RUTAS PARA PACIENTES ---
@app.route('/api/pacientes', methods=['GET', 'POST'])
def gestionar_pacientes():
    clinica_id = request.args.get('clinica_id')
    
    if request.method == 'GET':
        # Traer pacientes de Supabase filtrados por clínica
        response = supabase.table('pacientes').select("*").eq('clinica_id', clinica_id).execute()
        return jsonify(response.data)

    if request.method == 'POST':
        datos = request.json
        # Guardar en Supabase
        response = supabase.table('pacientes').insert(datos).execute()
        return jsonify(response.data), 201

# --- RUTAS PARA CITAS ---
@app.route('/api/citas', methods=['GET', 'POST'])
def gestionar_citas():
    clinica_id = request.args.get('clinica_id')

    if request.method == 'GET':
        response = supabase.table('citas').select("*, pacientes(nombre)").eq('clinica_id', clinica_id).execute()
        return jsonify(response.data)

    if request.method == 'POST':
        datos = request.json
        response = supabase.table('citas').insert(datos).execute()
        return jsonify(response.data), 201

if __name__ == '__main__':
    # Usar el puerto que asigne Render o el 5000 por defecto
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)