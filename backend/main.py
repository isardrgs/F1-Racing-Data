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

# Cria um diretório temporário no servidor (apaga quando o servidor reinicia)
temp_dir = tempfile.gettempdir()
cache_path = os.path.join(temp_dir, 'f1_cache')
if not os.path.exists(cache_path):
    os.makedirs(cache_path)
fastf1.Cache.enable_cache(cache_path)
fastf1.plotting.setup_mpl(misc_mpl_mods=False)

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
        # OTIMIZAÇÃO MAXIMA: Carrega só as voltas. Telemetria pesa muito, então tentamos sem ela primeiro.
        session_data.load(laps=True, telemetry=True, weather=False, messages=False)
        
        resultados = session_data.results
        dados_tabela = []
        posicao_real = 1 
        
        for index, row in resultados.iterrows():
            cor = "#555555" 
            team_color = row.get('TeamColor')
            if pd.notnull(team_color) and str(team_color).strip() not in ['', 'nan', 'None']:
                cor = f"#{str(team_color).strip()}"
            else:
                try:
                    cor_lib = fastf1.plotting.team_color(row['TeamName'])
                    cor = f"#{cor_lib}" if not cor_lib.startswith('#') else cor_lib
                except: pass
            
            if cor.startswith("##"): cor = cor[1:]

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

            try:
                pos = row.get('Position')
                posicao = int(float(pos)) if pd.notnull(pos) and str(pos).lower() != 'nan' else posicao_real
            except:
                posicao = posicao_real

            dados_tabela.append({"pos": posicao, "driver": driver_id, "team": str(row.get('TeamName', 'Unknown')), "time": tempo, "color": cor})
            posicao_real += 1
            
        img_base64 = ""
        try:
            lap = session_data.laps.pick_fastest()
            tel = lap.get_telemetry()
            
            fig, ax = plt.subplots(figsize=(6, 6))
            ax.plot(tel['X'], tel['Y'], color='#e10600', linewidth=4)
            ax.set_facecolor('#111111')
            fig.patch.set_facecolor('#111111')
            ax.axis('off')
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            pass # Se a F1 bloquear a telemetria, não desenha o mapa, mas entrega a tabela intacta.
        
        return {"sucesso": True, "resultados": dados_tabela, "circuito_base64": f"data:image/png;base64,{img_base64}" if img_base64 else None}
    except Exception as e:
        traceback.print_exc() 
        return {"sucesso": False, "erro": str(e)}
