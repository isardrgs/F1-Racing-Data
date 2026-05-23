import fastf1
import os

# Configura a mesma pasta de cache do seu site
if not os.path.exists('cache_dir'):
    os.makedirs('cache_dir')
fastf1.Cache.enable_cache('cache_dir')

# Define os anos que você quer deixar prontos para os usuários
anos_para_baixar = [2025, 2026,2024,2023,2022,2021,2020,2019,2018]

for ano in anos_para_baixar:
    print(f"\n--- Iniciando downloads do ano {ano} ---")
    schedule = fastf1.get_event_schedule(ano)
    corridas_df = schedule[schedule['EventFormat'] != 'testing']
    
    for corrida in corridas_df['EventName']:
        print(f"Baixando telemetria: {corrida}...")
        try:
            session = fastf1.get_session(ano, corrida, 'R')
            # Isso força o download para o cache_dir
            session.load(telemetry=True, weather=False, messages=False) 
        except Exception as e:
            print(f"Não foi possível baixar {corrida} (pode ainda não ter acontecido).")

print("\nPré-carregamento concluído! O seu dashboard agora vai abrir instantaneamente.")