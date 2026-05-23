from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import os
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists('cache_dir'):
    os.makedirs('cache_dir')
fastf1.Cache.enable_cache('cache_dir')

@app.get("/api/calendario/2026")
def obter_calendario():
    try:
        schedule = fastf1.get_event_schedule(2026)
        eventos = schedule[schedule['EventFormat'] != 'testing']
        calendario = []
        
        for _, row in eventos.iterrows():
            data_evento = row.get('EventDate')
            data_str = data_evento.strftime('%d/%m/%Y') if pd.notna(data_evento) else "TBD"

            calendario.append({
                "gp": str(row['EventName']),
                "circuito": str(row['Location']),
                "data": data_str
            })
        return {"sucesso": True, "calendario": calendario}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@app.get("/api/corridas/{ano}")
def listar_corridas(ano: int):
    try:
        schedule = fastf1.get_event_schedule(ano)
        corridas_df = schedule[schedule['EventFormat'] != 'testing']
        corridas = corridas_df['EventName'].tolist()
        return {"corridas": corridas}
    except Exception:
        return {"corridas": []}

@app.get("/api/sessoes/{ano}/{gp}")
def listar_sessoes(ano: int, gp: str):
    try:
        event = fastf1.get_event(ano, gp)
        sessoes = []
        for i in range(1, 6):
            nome_sessao = event.get(f'Session{i}')
            if pd.notna(nome_sessao) and str(nome_sessao).strip() != '' and str(nome_sessao).strip() != 'None':
                sessoes.append(str(nome_sessao))
        return {"sucesso": True, "sessoes": sessoes}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@app.get("/api/resultado/{ano}/{gp}/{sessao}")
def obter_resultado(ano: int, gp: str, sessao: str):
    try:
        session_data = fastf1.get_session(ano, gp, sessao)
        session_data.load(telemetry=True, weather=False, messages=False)
        
        resultados = session_data.results
        dados_tabela = []
        
        for index, row in resultados.iterrows():
            cor = "#555555" 
            team_color = row.get('TeamColor')
            if pd.notnull(team_color):
                color_str = str(team_color).strip()
                if color_str and color_str.lower() != 'nan':
                    cor = f"#{color_str}" if not color_str.startswith('#') else color_str
            
            tempo = "N/A"
            best_lap = row.get('BestLapTime')
            if pd.notnull(best_lap) and str(best_lap).lower() != 'nan':
                try:
                    total_seconds = best_lap.total_seconds()
                    minutos = int(total_seconds // 60)
                    segundos = total_seconds % 60
                    tempo = f"{minutos}:{segundos:06.3f}"
                except Exception:
                    pass

            try:
                pos = row.get('Position')
                if pd.notnull(pos) and str(pos).lower() != 'nan':
                    posicao = int(float(pos))
                else:
                    posicao = int(index) + 1 
            except Exception:
                posicao = int(index) + 1

            dados_tabela.append({
                "pos": posicao,
                "driver": str(row.get('Abbreviation', 'UNK')),
                "team": str(row.get('TeamName', 'Unknown')),
                "time": tempo,
                "color": cor
            })
            
        # LÓGICA DO MAPA COM BACKUP INTELIGENTE
        img_base64 = ""
        try:
            try:
                # Tenta pegar o mapa usando a sessão selecionada
                lap = session_data.laps.pick_fastest()
                tel = lap.get_telemetry()
                circ_info = session_data.get_circuit_info()
            except Exception:
                # Se falhar (comum em treinos), puxa a corrida oficial daquele ano/GP como backup
                session_backup = fastf1.get_session(ano, gp, 'R')
                session_backup.load(telemetry=True, weather=False, messages=False)
                lap = session_backup.laps.pick_fastest()
                tel = lap.get_telemetry()
                circ_info = session_backup.get_circuit_info()
            
            fig, ax = plt.subplots(figsize=(6, 6))
            ax.plot(tel['X'], tel['Y'], color='#e10600', linewidth=4)
            
            if circ_info is not None:
                for _, corner in circ_info.corners.iterrows():
                    num = str(corner['Number'])
                    letra = str(corner['Letter']) if pd.notna(corner['Letter']) else ''
                    texto = f"{num}{letra}"
                    
                    ax.text(corner['X'], corner['Y'], texto, 
                            color='white', fontsize=7, ha='center', va='center', weight='bold',
                            bbox=dict(boxstyle='circle,pad=0.2', facecolor='#111111', edgecolor='#444444', alpha=0.9))

            ax.set_facecolor('#111111')
            fig.patch.set_facecolor('#111111')
            ax.axis('off')
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            print(f"Traçado indisponível mesmo com backup: {e}")
        
        return {
            "sucesso": True,
            "resultados": dados_tabela,
            "circuito_base64": f"data:image/png;base64,{img_base64}" if img_base64 else None
        }
    except Exception as e:
        traceback.print_exc() 
        return {"sucesso": False, "erro": str(e)}
