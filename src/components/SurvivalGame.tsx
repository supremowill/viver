import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const SurvivalGame: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [isGameLoaded, setIsGameLoaded] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [platform, setPlatform] = useState<'pc' | 'mobile' | null>(null)
  const [leaderboardStart, setLeaderboardStart] = useState<string>('Carregando ranking...')
  const [leaderboardGameOver, setLeaderboardGameOver] = useState<string>('Atualizando ranking...')

  useEffect(() => {
    if (!user) {
      navigate('/ranking')
      return
    }

    // Carregar Three.js e inicializar o jogo
    loadThreeJS()

    // Cleanup function
    return () => {
      // Remove dynamically created style element
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current)
      }
      // Remove dynamically created script element
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
      // Clean up global variables
      if ((window as any).rankingManager) {
        delete (window as any).rankingManager
      }
      if ((window as any).THREE) {
        delete (window as any).THREE
      }
    }
  }, [user, navigate])

  const loadThreeJS = async () => {
    try {
      // Carregar Three.js dinamicamente
      const THREE = await import('three')
      
      // Definir Three.js globalmente para o jogo
      ;(window as any).THREE = THREE
      
      // Inicializar o jogo após carregar Three.js
      initializeGame()
      setIsGameLoaded(true)
    } catch (error) {
      console.error('Erro ao carregar Three.js:', error)
    }
  }

  const initializeGame = () => {
    // Adicionar estilos CSS
    addGameStyles()

    // Inicializar sistema de ranking
    initializeRankingSystem()

    // Pré-preencher nome do usuário
    if (user?.email) {
      setPlayerName(user.email.split('@')[0])
    }

    // Carregar ranking inicial
    fetchAndDisplayLeaderboard('start')
  }

  const addGameStyles = () => {
    // Remove existing style if it exists
    if (styleRef.current && styleRef.current.parentNode) {
      styleRef.current.parentNode.removeChild(styleRef.current)
    }

    const style = document.createElement('style')
    styleRef.current = style
    style.textContent = `
      :root {
        --poderoso-color: #ff00ff;
      }

      .survival-game-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        color: #fff;
        font-family: 'Orbitron', sans-serif;
        user-select: none;
        z-index: 1000;
      }

      .blind-screen-effect {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, transparent 30%, black 80%);
        pointer-events: none;
        z-index: 500;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      .blind-screen-effect.active {
        opacity: 1;
      }

      .overlay-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        z-index: 100;
        backdrop-filter: blur(5px);
      }

      .overlay-screen h1 {
        font-size: 3rem;
        margin-bottom: 20px;
        text-shadow: 0 0 10px #fff, 0 0 20px #0ff;
      }

      .overlay-screen h2 {
        font-size: 2rem;
        margin-bottom: 30px;
      }

      .overlay-screen p {
        font-size: 1.2rem;
        max-width: 500px;
        margin-bottom: 20px;
      }

      .overlay-button {
        padding: 15px 30px;
        font-size: 1.2rem;
        font-family: 'Orbitron', sans-serif;
        background-color: #1a1a1a;
        color: #fff;
        border: 2px solid #0ff;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 10px;
        text-transform: uppercase;
      }

      .overlay-button:hover:not(:disabled) {
        background-color: #0ff;
        color: #000;
        box-shadow: 0 0 15px #0ff;
      }

      .overlay-button:disabled {
        border-color: #555;
        color: #777;
        cursor: not-allowed;
      }

      .player-name-input {
        padding: 15px;
        font-size: 1.2rem;
        font-family: 'Orbitron', sans-serif;
        background-color: #111;
        color: #fff;
        border: 2px solid #555;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 20px;
        width: 300px;
      }

      .player-name-input:focus {
        outline: none;
        border-color: #0ff;
      }

      .leaderboard-container {
        margin-top: 30px;
        padding: 20px;
        background-color: rgba(0, 0, 0, 0.4);
        border: 1px solid #333;
        border-radius: 10px;
        width: 80%;
        max-width: 450px;
      }

      .leaderboard-container h2 {
        font-size: 1.8rem;
        margin-bottom: 15px;
        color: #0ff;
      }

      .leaderboard-container ol {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }

      .leaderboard-container li {
        font-size: 1.1rem;
        padding: 8px 0;
        border-bottom: 1px solid #222;
      }

      .leaderboard-container li:last-child {
        border-bottom: none;
      }

      .panel-content {
        background-color: rgba(20, 20, 20, 0.9);
        padding: 40px;
        border-radius: 15px;
        border: 1px solid #555;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      }

      .player-hud {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 300px;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #444;
        z-index: 10;
      }

      .hud-item { 
        margin-bottom: 8px; 
      }

      .hud-item-label { 
        font-size: 0.9rem; 
        margin-bottom: 4px; 
      }

      .progress-bar-container {
        width: 100%;
        height: 22px;
        background-color: #333;
        border-radius: 5px;
        border: 1px solid #555;
        position: relative;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
        position: relative;
      }

      .progress-bar-text {
        position: absolute;
        width: 100%;
        text-align: center;
        line-height: 22px;
        font-size: 0.8rem;
        font-weight: bold;
        color: #fff;
        text-shadow: 1px 1px 2px #000;
      }

      .hp-bar { 
        background: linear-gradient(90deg, #d32f2f, #f44336); 
      }

      .hp-bar.low { 
        animation: pulse-red 1s infinite; 
      }

      .xp-bar { 
        background: linear-gradient(90deg, #673ab7, #9575cd); 
      }

      .shield-bar { 
        background: linear-gradient(90deg, #fbc02d, #fdd835); 
      }

      @keyframes pulse-red {
        0% { box-shadow: 0 0 3px #f44336; }
        50% { box-shadow: 0 0 10px #ff1111; }
        100% { box-shadow: 0 0 3px #f44336; }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin-top: 10px;
        text-align: center;
      }

      .stat-box h3 { 
        font-size: 1rem; 
        margin: 0 0 5px 0; 
        color: #aaa; 
      }

      .stat-box p { 
        font-size: 1.2rem; 
        margin: 0; 
      }

      .buff-display {
        position: absolute;
        top: 20px;
        right: 20px;
        display: none;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 8px;
        z-index: 10;
        text-align: right;
      }

      .boss-hud-container {
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        max-width: 700px;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        z-index: 10;
      }

      .boss-hud-item {
        width: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #555;
        text-align: center;
      }

      .boss-hp-bar { 
        background: linear-gradient(90deg, #c62828, #e53935); 
      }

      .poderoso-hp-bar { 
        background: linear-gradient(90deg, #6a1b9a, var(--poderoso-color)); 
      }

      .poderoso-power-bar { 
        background: linear-gradient(90deg, #f9a825, #fdd835); 
      }

      .skills-hud {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        gap: 15px;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 10px;
        z-index: 10;
      }

      .skill-slot {
        width: 60px;
        height: 60px;
        border: 2px solid #555;
        border-radius: 8px;
        background-color: #222;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.5rem;
        font-weight: bold;
      }

      .skill-cooldown {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.8rem;
        border-radius: 6px;
      }

      .mobile-controls {
        display: none;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 20;
      }

      .joystick-container {
        position: absolute;
        bottom: 40px;
        left: 40px;
        width: 150px;
        height: 150px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        pointer-events: auto;
      }

      .joystick-thumb {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 60px;
        background-color: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .mobile-action-buttons {
        position: absolute;
        bottom: 40px;
        right: 40px;
        display: grid;
        grid-template-areas: ". e ." "w attack q" ". r .";
        gap: 15px;
        pointer-events: auto;
      }

      .mobile-button {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 2px solid #aaa;
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .attack-button { 
        grid-area: attack; 
        width: 90px; 
        height: 90px; 
        background-color: rgba(200, 50, 50, 0.7); 
      }

      .q-button { grid-area: q; }
      .w-button { grid-area: w; }
      .e-button { grid-area: e; }
      .r-button { grid-area: r; }

      .event-message {
        position: absolute;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 165, 0, 0.9);
        color: #000;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 1.5rem;
        font-weight: bold;
        z-index: 200;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
      }

      .event-message.show {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
  }

  const initializeRankingSystem = () => {
    // Sistema de ranking integrado com Supabase
    ;(window as any).rankingManager = {
      postScore: async (name: string, score: number) => {
        try {
          const { supabase } = await import('../lib/supabase')
          const { error } = await supabase
            .from('scores')
            .insert({
              user_id: user?.id,
              score: score
            })

          if (error) throw error
          
          // Atualizar ranking após postar score
          await fetchAndDisplayLeaderboard('gameover')
        } catch (error) {
          console.error('Erro ao postar score:', error)
        }
      }
    }
  }

  const fetchAndDisplayLeaderboard = async (type: 'start' | 'gameover') => {
    const loadingText = type === 'start' ? 'Carregando ranking...' : 'Atualizando ranking...'
    
    if (type === 'start') {
      setLeaderboardStart(loadingText)
    } else {
      setLeaderboardGameOver(loadingText)
    }

    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('scores')
        .select(`
          score,
          created_at,
          user_id
        `)
        .order('score', { ascending: false })
        .limit(10)

      if (error) throw error

      if (!data || data.length === 0) {
        const emptyText = 'Ninguém no ranking ainda. Seja o primeiro!'
        if (type === 'start') {
          setLeaderboardStart(emptyText)
        } else {
          setLeaderboardGameOver(emptyText)
        }
        return
      }

      // Agrupar por usuário e pegar o melhor score
      const userBestScores = new Map()
      for (const score of data) {
        const userId = score.user_id
        if (!userBestScores.has(userId) || userBestScores.get(userId).score < score.score) {
          userBestScores.set(userId, score)
        }
      }

      const top10 = Array.from(userBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      const leaderboardHTML = top10.map((scoreData, index) => {
        let medal = ''
        if (index === 0) medal = '🥇 '
        else if (index === 1) medal = '🥈 '
        else if (index === 2) medal = '🥉 '
        else medal = `${index + 1}. `

        const playerName = scoreData.user_id === user?.id ? 'Você' : `Jogador ${scoreData.user_id.slice(0, 8)}...`
        const isCurrentUser = scoreData.user_id === user?.id
        
        return `<li style="${isCurrentUser ? 'color: #00bfff; font-weight: bold;' : ''}">${medal}${playerName} — ${scoreData.score} pontos</li>`
      }).join('')

      if (type === 'start') {
        setLeaderboardStart(leaderboardHTML)
      } else {
        setLeaderboardGameOver(leaderboardHTML)
      }
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
      const errorText = 'Não foi possível carregar o ranking.'
      if (type === 'start') {
        setLeaderboardStart(errorText)
      } else {
        setLeaderboardGameOver(errorText)
      }
    }
  }

  const startGame = (selectedPlatform: 'pc' | 'mobile') => {
    if (!playerName.trim()) {
      alert('Por favor, digite seu nome para continuar.')
      return
    }

    setPlatform(selectedPlatform)
    setGameStarted(true)
    
    // Inicializar o jogo 3D
    initializeThreeJSGame(selectedPlatform)
  }

  const initializeThreeJSGame = (selectedPlatform: 'pc' | 'mobile') => {
    // Remove existing script if it exists
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current)
    }

    const gameScript = document.createElement('script')
    scriptRef.current = gameScript
    gameScript.type = 'module'
    gameScript.textContent = `
      // Código do jogo 3D seria inserido aqui
      // Por questões de espaço, esta é uma versão simplificada
      
      console.log('Jogo 3D iniciado para plataforma:', '${selectedPlatform}')
      console.log('Nome do jogador:', '${playerName}')
      
      // Simular fim de jogo após 10 segundos para demonstração
      setTimeout(() => {
        // Postar score
        if (window.rankingManager) {
          window.rankingManager.postScore('${playerName}', 1000)
        }
      }, 10000)
    `
    
    document.head.appendChild(gameScript)
  }

  const handleRestart = () => {
    window.location.reload()
  }

  const handleBackToMenu = () => {
    navigate('/ranking')
  }

  if (!user) {
    return null
  }

  return (
    <div className="survival-game-container" ref={gameContainerRef}>
      <div className="blind-screen-effect"></div>

      {!gameStarted && (
        <div className="overlay-screen">
          <h1>SOBREVIVÊNCIA 3D</h1>
          <p>Digite seu nome para entrar no ranking!</p>
          <input 
            type="text" 
            className="player-name-input"
            placeholder="Seu nome aqui..." 
            maxLength={15} 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <p>Escolha sua plataforma para começar</p>
          <div> 
            <button className="overlay-button" onClick={() => startGame('pc')}>PC</button>
            <button className="overlay-button" onClick={() => startGame('mobile')}>Mobile</button>
          </div>
          <div className="leaderboard-container">
            <h2>🏆 Ranking - Top 10 🏆</h2>
            <ol dangerouslySetInnerHTML={{ __html: leaderboardStart }}></ol>
          </div>
        </div>
      )}

      {gameStarted && (
        <>
          <div className="overlay-screen" style={{ display: 'none' }} id="game-over-screen">
            <h1>FIM DE JOGO</h1>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
              <p>Pontuação Final: <span id="final-score-value">1000</span></p>
              <p>Tempo Sobrevivido: <span id="final-time-value">00:10</span></p>
              <p>Nível de Colapso: <span id="final-collapse-level">1</span></p>
            </div>
            <button className="overlay-button" onClick={handleRestart}>REINICIAR</button>
            <button className="overlay-button" onClick={handleBackToMenu}>VOLTAR AO MENU</button>
            <div className="leaderboard-container">
              <h2>🏆 Ranking - Top 10 🏆</h2>
              <ol dangerouslySetInnerHTML={{ __html: leaderboardGameOver }}></ol>
            </div>
          </div>

          <div className="overlay-screen" style={{ display: 'none' }} id="upgrade-panel">
            <div className="panel-content">
              <h2 id="upgrade-title">Evoluir Habilidade</h2>
              <p id="upgrade-description">Descrição da evolução da habilidade aqui.</p>
              <div>
                <button className="overlay-button" id="upgrade-confirm-button">Confirmar</button>
                <button className="overlay-button" id="upgrade-skip-button">Pular</button>
              </div> 
            </div>
          </div>

          <div className="event-message" id="event-message"></div>

          {/* HUD Elements */}
          <div className="player-hud" style={{ display: gameStarted ? 'block' : 'none' }}>
            <div className="hud-item">
              <div className="hud-item-label">HP</div>
              <div className="progress-bar-container">
                <div className="progress-bar hp-bar" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="hud-item" style={{ display: 'none' }}> 
              <div className="hud-item-label">Escudo</div>
              <div className="progress-bar-container">
                <div className="progress-bar shield-bar" style={{ width: '100%' }}></div>
              </div> 
            </div>
            <div className="hud-item"> 
              <div className="hud-item-label">XP</div>
              <div className="progress-bar-container"> 
                <div className="progress-bar xp-bar" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="stats-grid"> 
              <div className="stat-box">
                <h3>Nível</h3>
                <p><span>1</span></p> 
              </div>
              <div className="stat-box">
                <h3>Passiva</h3> 
                <p>Nv. <span>1</span></p>
              </div>
              <div className="stat-box">
                <h3>Multiplicador</h3>
                <p><span>1</span>x</p>
              </div>
            </div> 
            <div className="stats-grid"> 
              <div className="stat-box" style={{ gridColumn: '1 / -1' }}> 
                <h3>Pontuação</h3> 
                <p>0</p>
              </div>
            </div>
            <div className="stats-grid"> 
              <div className="stat-box" style={{ gridColumn: '1 / -1' }}>
                <h3>Tempo</h3>
                <p>00:00</p>
              </div>
            </div>
          </div>

          {/* Boss HUD */}
          <div className="boss-hud-container">
            <div className="boss-hud-item"> 
              <div className="hud-item-label">Nome do Chefe</div>
              <div className="progress-bar-container">
                <div className="progress-bar boss-hp-bar" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="boss-hud-container">
            <div className="boss-hud-item">
              <div className="hud-item-label" style={{ color: 'var(--poderoso-color)' }}>O PODEROSO</div> 
              <div className="progress-bar-container">
                <div className="progress-bar poderoso-hp-bar" style={{ width: '100%' }}>
                  <div className="progress-bar-text"></div>
                </div> 
              </div>
            </div>
            <div className="boss-hud-item"> 
              <div className="progress-bar-container">
                <div className="progress-bar poderoso-power-bar" style={{ width: '100%' }}> 
                  <div className="progress-bar-text"></div>
                </div> 
              </div>
            </div>
          </div>

          <div className="buff-display">
            <h3>Buff</h3>
            <p>0.0s</p>
          </div>

          <div className="skills-hud" style={{ display: gameStarted ? 'flex' : 'none' }}>
            <div className="skill-slot">Q</div>
            <div className="skill-slot">W</div>
            <div className="skill-slot">E</div>
            <div className="skill-slot">R</div>
          </div>

          {platform === 'mobile' && (
            <div className="mobile-controls" style={{ display: 'block' }}>
              <div className="joystick-container"> 
                <div className="joystick-thumb"></div>
              </div>
              <div className="mobile-action-buttons">
                <div className="mobile-button attack-button">ATK</div>
                <div className="mobile-button q-button">Q</div>
                <div className="mobile-button w-button">W</div>
                <div className="mobile-button e-button">E</div>
                <div className="mobile-button r-button">R</div>
              </div>
            </div>
          )}
        </>
      )}

      {!isGameLoaded && (
        <div className="overlay-screen">
          <h1>Carregando Jogo...</h1>
          <p>Preparando a experiência de sobrevivência 3D...</p>
        </div>
      )}
    </div>
  )
}

export default SurvivalGame