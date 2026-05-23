from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import fastf1.plotting
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
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

# Configuração do diretório temporário para o cache fugaz do Render
temp_dir = tempfile.gettempdir()
cache_path = os.path.join(temp_dir, 'f1_cache')
if not os.path.exists(cache_path):
    os.makedirs(cache_path)
fastf1.Cache.enable_cache(cache_path)
fastf1.plotting.setup_mpl(misc_mpl_mods=False)

@app.get("/api/calendario/2026")
def obter_calendario():
    try:
        schedule = fastf1.get_event_schedule(2026)
        eventos = schedule[schedule['EventFormat'] != 'testing']
        calendario = []
        for _, row in eventos.iterrows():
            data_evento = row.get('EventDate')
            data_str = data_evento.strftime('%d/%m/%Y') if pd.notna(data_evento) else "TBD"
            calendario.append({"gp": str(row['EventName']), "circuito": str(row['Location']), "data": data_str})
        return {"sucesso": True, "calendario": calendario}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@app.get("/api/corridas/{ano}")
def listar_corridas(ano: int):
    try:
        schedule = fastf1.get_event_schedule(ano)
        corridas_df = schedule[schedule['EventFormat'] != 'testing']
        return {"corridas": corridas_df['EventName'].tolist()}
    except Exception:
        return {"corridas": []}

@app.get("/api/sessoes/{ano}/{gp}")
def listar_sessoes(ano: int, gp: str):
    try:
        event = fastf1.get_event(ano, gp)
        sessoes = [str(event.get(f'Session{i}')) for i in range(1, 6) if pd.notna(event.get(f'Session{i}'))]
        return {"sucesso": True, "sessoes": sessoes}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@app.get("/api/resultado/{ano}/{gp}/{sessao}")
def obter_resultado(ano: int, gp: str, sessao: str):
    try:
        session_data = fastf1.get_session(ano, gp, sessao)
        
        # OTIMIZAÇÃO: telemetry=False impede o download pesado, driblando limite de RAM
        session_data.load(laps=True, telemetry=False, weather=False, messages=False)
        
        resultados = session_data.results
        dados_tabela = []
        posicao_real = 1 
        
        # DICIONÁRIO SALVA-VIDAS DE DESIGN: Garante a identidade visual se a API falhar
        cores_manuais = {
            "red bull": "#3671C6", "ferrari": "#E80020", "mclaren": "#FF8000",
            "mercedes": "#27F4D2", "aston martin": "#229971", "rb": "#6692FF",
            "haas": "#B6BABD", "williams": "#64C4FF", "sauber": "#52E252",
            "alpine": "#0093CC"
        }
        
        for index, row in resultados.iterrows():
            # 1. Resgate da Identidade Visual
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

            # 2. Resgate de Tempos (Tenta Volta Rápida, depois Tenta Gap de Corrida)
            tempo = "N/A"
            driver_id = str(row.get('Abbreviation', 'UNK'))
            
            try:
                drv_laps = session_data.laps.pick_driver(driver_id)
                if not drv_laps.empty:
                    fastest = drv_laps.pick_fastest()
                    b_lap = fastest.get('LapTime')
                    if pd.notnull(b_lap) and str(b_lap).lower() != 'nat':
                        tempo = f"{int(b_lap.total_seconds() // 60)}:{b_lap.total_seconds() % 60:06.3f}"
            except: pass

            if tempo == "N/A":
                try:
                    # Tenta extrair o Gap/Intervalo que o Ergast fornece como backup
                    t_str = str(row.get('Time', 'N/A'))
                    if t_str not in ['NaT', 'nan', 'None', 'N/A']:
                        # Limpa o formato feio de data que o Pandas devolve
                        tempo_limpo = str(t_str).split()[-1] 
                        tempo = f"+{tempo_limpo[:8]}" if not tempo_limpo.startswith('+') else tempo_limpo[:8]
                except: pass

            try:
                pos = row.get('Position')
                posicao = int(float(pos)) if pd.notnull(pos) and str(pos).lower() != 'nan' else posicao_real
            except:
                posicao = posicao_real

            dados_tabela.append({
                "pos": posicao, 
                "driver": driver_id, 
                "team": team_name, 
                "time": tempo, 
                "color": cor
            })
            posicao_real += 1
            
        return {
            "sucesso": True, 
            "resultados": dados_tabela, 
            "circuito_base64": None
        }
    except Exception as e:
        traceback.print_exc() 
        return {"sucesso": False, "erro": str(e)}
