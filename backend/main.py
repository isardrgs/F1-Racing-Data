from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import pandas as pd
import os
import tempfile
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

temp_dir = tempfile.gettempdir()
cache_path = os.path.join(temp_dir, 'f1_cache')
if not os.path.exists(cache_path):
    os.makedirs(cache_path)
fastf1.Cache.enable_cache(cache_path)

cores_manuais = {
    "red bull": "#3671C6", "ferrari": "#E80020", "mclaren": "#FF8000",
    "mercedes": "#27F4D2", "aston martin": "#229971", "rb": "#6692FF",
    "haas": "#B6BABD", "williams": "#64C4FF", "sauber": "#52E252",
    "alpine": "#0093CC", "alphatauri": "#2B4562", "alfa romeo": "#900000",
    "racing point": "#F596C8", "renault": "#FFF500"
}

@app.get("/api/corridas/{ano}")
def listar_corridas(ano: int):
    try:
        schedule = fastf1.get_event_schedule(ano)
        corridas_df = schedule[schedule['EventFormat'] != 'testing']
        return {"corridas": corridas_df['EventName'].tolist()}
    except Exception: return {"corridas": []}

@app.get("/api/sessoes/{ano}/{gp}")
def listar_sessoes(ano: int, gp: str):
    try:
        event = fastf1.get_event(ano, gp)
        sessoes = []
        for i in range(1, 6):
            nome = str(event.get(f'Session{i}'))
            # FILTRO: Aceita apenas Classificações e Corridas
            if pd.notna(nome) and nome not in ['nan', 'None'] and any(x in nome for x in ['Qualifying', 'Race', 'Sprint']):
                sessoes.append(nome)
        return {"sucesso": True, "sessoes": sessoes}
    except Exception as e: return {"sucesso": False, "erro": str(e)}

@app.get("/api/resultado/{ano}/{gp}/{sessao}")
def obter_resultado(ano: int, gp: str, sessao: str):
    try:
        session_data = fastf1.get_session(ano, gp, sessao)
        session_data.load(laps=True, telemetry=False, weather=False, messages=False)
        
        resultados = session_data.results
        dados_tabela = []
        posicao_real = 1 
        
        for index, row in resultados.iterrows():
            cor = "#555555" 
            team_name = str(row.get('TeamName', 'Unknown'))
            team_color = row.get('TeamColor')
            
            if pd.notnull(team_color) and str(team_color).strip() not in ['', 'nan', 'None']:
                cor = f"#{str(team_color).strip()}"
            else:
                for chave, valor in cores_manuais.items():
                    if chave in team_name.lower():
                        cor = valor
                        break
            if cor.startswith("##"): cor = cor[1:]

            tempo = "N/A"
            driver_id = str(row.get('Abbreviation', 'UNK'))

            for q in ['Q3', 'Q2', 'Q1']:
                try:
                    q_time = row.get(q)
                    if pd.notnull(q_time) and str(q_time).lower() not in ['nat', 'nan']:
                        tempo = f"{int(q_time.total_seconds() // 60)}:{q_time.total_seconds() % 60:06.3f}"
                        break
                except: pass

            if tempo == "N/A":
                try:
                    drv_laps = session_data.laps.pick_driver(driver_id)
                    if not drv_laps.empty:
                        fastest = drv_laps.pick_fastest()
                        b_lap = fastest.get('LapTime')
                        if pd.notnull(b_lap) and str(b_lap).lower() not in ['nat', 'nan']:
                            tempo = f"{int(b_lap.total_seconds() // 60)}:{b_lap.total_seconds() % 60:06.3f}"
                except: pass

            if tempo == "N/A":
                try:
                    t_str = str(row.get('Time', 'N/A'))
                    if t_str not in ['NaT', 'nan', 'None', 'N/A']:
                        tempo_limpo = str(t_str).split()[-1] 
                        tempo = f"+{tempo_limpo[:8]}" if not tempo_limpo.startswith('+') else tempo_limpo[:8]
                except: pass

            try:
                pos = row.get('Position')
                posicao = int(float(pos)) if pd.notnull(pos) and str(pos).lower() != 'nan' else posicao_real
            except: posicao = posicao_real

            dados_tabela.append({"pos": posicao, "driver": driver_id, "team": team_name, "time": tempo, "color": cor})
            posicao_real += 1
            
        return {"sucesso": True, "resultados": dados_tabela}
    except Exception as e:
        traceback.print_exc() 
        return {"sucesso": False, "erro": str(e)}
