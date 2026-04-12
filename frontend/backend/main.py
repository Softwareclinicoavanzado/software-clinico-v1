import os
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
        response = supabase.table('pacientes').select("*").eq('clinica_id', clinica_id).execute()
        return jsonify(response.data)

    if request.method == 'POST':
        datos = request.json
        # Verificación de seguridad: si no hay ID, lo generamos para evitar errores en Supabase
        if 'id' not in datos:
            import time
            datos['id'] = int(time.time())
            
        response = supabase.table('pacientes').insert(datos).execute()
        return jsonify(response.data), 201

# --- NUEVA RUTA: HISTORIAL CLÍNICO ---
@app.route('/api/historial', methods=['GET', 'POST'])
def gestionar_historial():
    paciente_id = request.args.get('paciente_id')

    if request.method == 'GET':
        if not paciente_id:
            return jsonify({"error": "Falta paciente_id"}), 400
        # Traemos el historial del paciente específico ordenado por fecha
        response = supabase.table('historial').select("*").eq('paciente_id', paciente_id).order('id', desc=True).execute()
        return jsonify(response.data)

    if request.method == 'POST':
        datos = request.json
        # Insertamos la nueva nota médica
        response = supabase.table('historial').insert(datos).execute()
        return jsonify(response.data), 201

# --- CITAS ---
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
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
