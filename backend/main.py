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

# 1. Rota do Calendário com Data
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

# 2. Rota para listar os GPs do ano
@app.get("/api/corridas/{ano}")
def listar_corridas(ano: int):
    try:
        schedule = fastf1.get_event_schedule(ano)
        corridas_df = schedule[schedule['EventFormat'] != 'testing']
        corridas = corridas_df['EventName'].tolist()
        return {"corridas": corridas}
    except Exception:
        return {"corridas": []}

# 3. NOVA ROTA: Listar quais sessões existem naquele GP (Treinos, Qualy, Sprint, Corrida)
@app.get("/api/sessoes/{ano}/{gp}")
def listar_sessoes(ano: int, gp: str):
    try:
        event = fastf1.get_event(ano, gp)
        sessoes = []
        # A F1 tem até 5 sessões por final de semana
        for i in range(1, 6):
            nome_sessao = event.get(f'Session{i}')
            if pd.notna(nome_sessao) and str(nome_sessao).strip() != '' and str(nome_sessao).strip() != 'None':
                sessoes.append(str(nome_sessao))
        return {"sucesso": True, "sessoes": sessoes}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

# 4. Rota de Resultados atualizada para aceitar a Sessão escolhida
@app.get("/api/resultado/{ano}/{gp}/{sessao}")
def obter_resultado(ano: int, gp: str, sessao: str):
    try:
        # Carrega a sessão exata que você selecionou na tela
        session_data = fastf1.get_session(ano, gp, sessao)
        session_data.load(telemetry=True, weather=False, messages=False)
        
        resultados = session_data.results
        dados_tabela = []
        
        for index, row in resultados.iterrows():
            cor = f"#{row['TeamColor']}" if pd.notnull(row['TeamColor']) and str(row['TeamColor']).strip() != "" else "#ffffff"
            
            tempo = "N/A"
            try:
                laps_driver = session_data.laps.pick_driver(row['Abbreviation'])
                if not laps_driver.empty:
                    fastest_lap = laps_driver.pick_fastest()
                    best_lap = fastest_lap.get('LapTime')
                    
                    if pd.notnull(best_lap):
                        total_seconds = best_lap.total_seconds()
                        minutos = int(total_seconds // 60)
                        segundos = total_seconds % 60
                        tempo = f"{minutos}:{segundos:06.3f}"
            except Exception:
                pass

            try:
                posicao = int(float(row['Position']))
            except Exception:
                posicao = "-"

            dados_tabela.append({
                "pos": posicao,
                "driver": str(row['Abbreviation']),
                "team": str(row['TeamName']),
                "time": tempo,
                "color": cor
            })
            
        img_base64 = ""
        try:
            lap = session_data.laps.pick_fastest()
            tel = lap.get_telemetry()
            
            fig, ax = plt.subplots(figsize=(6, 6))
            ax.plot(tel['X'], tel['Y'], color='#e10600', linewidth=4)
            
            circuit_info = session_data.get_circuit_info()
            if circuit_info is not None:
                for _, corner in circuit_info.corners.iterrows():
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
            print(f"Não foi possível desenhar o traçado: {e}")
        
        return {
            "sucesso": True,
            "resultados": dados_tabela,
            "circuito_base64": f"data:image/png;base64,{img_base64}" if img_base64 else None
        }
    except Exception as e:
        traceback.print_exc() 
        return {"sucesso": False, "erro": str(e)}