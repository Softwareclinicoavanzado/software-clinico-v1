import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
# Permitimos CORS para que tu frontend en GitHub Pages pueda entrar sin bloqueos
CORS(app) 

# Configuración de Supabase
SUPABASE_URL = "https://klaygjvawybfksmahbhd.supabase.co"
SUPABASE_KEY = "sb_publishable_ZoyBvw_JncKIesGmjEpEuA_dSIZZV4Z"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/')
def home():
    return jsonify({"status": "online", "message": "ClinicOS Pro Backend Running"})

# --- PACIENTES ---
@app.route('/api/pacientes', methods=['GET', 'POST'])
def gestionar_pacientes():
    clinica_id = request.args.get('clinica_id')
    
    if request.method == 'GET':
        if not clinica_id:
            return jsonify({"error": "Falta clinica_id"}), 400
        
        try:
            response = supabase.table('pacientes').select("*").eq('clinica_id', clinica_id).execute()
            return jsonify(response.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        datos = request.json
        if not datos:
            return jsonify({"error": "No se enviaron datos"}), 400

        # Si el ID viene como String desde JS, lo aseguramos como número o generamos uno
        if 'id' not in datos or not datos['id']:
            datos['id'] = int(time.time())
            
        try:
            # Usamos upsert para que si el paciente ya existe (mismo ID), lo actualice en vez de fallar
            response = supabase.table('pacientes').upsert(datos).execute()
            return jsonify(response.data), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# --- HISTORIAL CLÍNICO ---
@app.route('/api/historial', methods=['GET', 'POST'])
def gestionar_historial():
    paciente_id = request.args.get('paciente_id')

    if request.method == 'GET':
        if not paciente_id:
            return jsonify({"error": "Falta paciente_id"}), 400
        
        try:
            # Traemos el historial ordenado por ID (tiempo) descendente
            response = supabase.table('historial').select("*").eq('paciente_id', paciente_id).order('id', desc=True).execute()
            return jsonify(response.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        datos = request.json
        if 'id' not in datos:
            datos['id'] = int(time.time() * 1000) # Milisegundos para evitar colisiones en notas rápidas

        try:
            response = supabase.table('historial').insert(datos).execute()
            return jsonify(response.data), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# --- CITAS ---
@app.route('/api/citas', methods=['GET', 'POST'])
def gestionar_citas():
    clinica_id = request.args.get('clinica_id')

    if request.method == 'GET':
        if not clinica_id:
            return jsonify({"error": "Falta clinica_id"}), 400
        try:
            # El join con pacientes(nombre) requiere que las tablas estén relacionadas en Supabase
            response = supabase.table('citas').select("*, pacientes(nombre)").eq('clinica_id', clinica_id).execute()
            return jsonify(response.data)
        except Exception as e:
            # Si el join falla por falta de relación, intentamos carga simple
            response = supabase.table('citas').select("*").eq('clinica_id', clinica_id).execute()
            return jsonify(response.data)

    if request.method == 'POST':
        datos = request.json
        try:
            response = supabase.table('citas').insert(datos).execute()
            return jsonify(response.data), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
