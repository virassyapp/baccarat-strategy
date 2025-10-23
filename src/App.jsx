import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BaccaratMobileApp = () => {
  const [bankroll, setBankroll] = useState(1000);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [initialBet, setInitialBet] = useState(10);
  const [history, setHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useStrategy, setUseStrategy] = useState(true);
  const [speed, setSpeed] = useState(1000);
  
  const [patternVerified, setPatternVerified] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  const [currentBet, setCurrentBet] = useState(null);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [recentResults, setRecentResults] = useState([]);
  
  const simulateRound = useCallback(() => {
    const playerScore = Math.floor(Math.random() * 10);
    const bankerScore = Math.floor(Math.random() * 10);
    
    let winner;
    if (playerScore > bankerScore) winner = 'Player';
    else if (bankerScore > playerScore) winner = 'Banker';
    else winner = 'Tie';
    
    const diff = Math.abs(playerScore - bankerScore);
    const diffType = diff % 2 === 0 ? 'Even' : 'Odd';
    
    return { playerScore, bankerScore, winner, diffType };
  }, []);
  
  const getSuggestedBet = useCallback((gameHistory) => {
    const nonTieRounds = gameHistory.filter(r => r.winner !== 'Tie');
    if (nonTieRounds.length < 1) return null;
    
    const lastRound = nonTieRounds[nonTieRounds.length - 1];
    const { diffType, winner } = lastRound;
    
    if (diffType === 'Even') {
      return winner === 'Player' ? 'Banker' : 'Player';
    } else {
      return winner;
    }
  }, []);
  
  const verifyPattern = useCallback((gameHistory) => {
    const nonTieRounds = gameHistory.filter(r => r.winner !== 'Tie');
    if (nonTieRounds.length < 2) return false;
    
    const prevRound = nonTieRounds[nonTieRounds.length - 2];
    const currRound = nonTieRounds[nonTieRounds.length - 1];
    
    if (prevRound.diffType === 'Even') {
      return prevRound.winner !== currRound.winner;
    } else {
      return prevRound.winner === currRound.winner;
    }
  }, []);
  
  const playRound = useCallback(() => {
    const result = simulateRound();
    const newHistory = [...history, result];
    setHistory(newHistory);
    
    setRecentResults(prev => [result, ...prev].slice(0, 10));
    
    let newBankroll = bankroll;
    let betPlaced = false;
    let won = false;
    
    if (result.winner !== 'Tie') {
      if (verifyPattern(newHistory)) {
        setVerificationCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 4) setPatternVerified(true);
          return newCount;
        });
      }
      
      if (patternVerified && useStrategy && currentBet && result.winner !== 'Tie') {
        betPlaced = true;
        
        if (currentBet === result.winner) {
          won = true;
          newBankroll += betAmount;
          setWins(prev => prev + 1);
          setBetAmount(initialBet);
          setConsecutiveLosses(0);
        } else {
          newBankroll -= betAmount;
          setLosses(prev => prev + 1);
          setConsecutiveLosses(prev => prev + 1);
          setBetAmount(prev => prev * 2);
        }
      }
      
      if (useStrategy && patternVerified) {
        const suggested = getSuggestedBet(newHistory);
        setCurrentBet(suggested);
      }
    }
    
    setBankroll(newBankroll);
    
    if (newBankroll <= 0) {
      setIsPlaying(false);
      alert('💸 Bankroll depleted! Resetting...');
      resetGame();
    }
  }, [history, bankroll, betAmount, currentBet, patternVerified, useStrategy, initialBet, simulateRound, verifyPattern, getSuggestedBet]);
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(playRound, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, playRound]);
  
  const resetGame = () => {
    setBankroll(initialBankroll);
    setBetAmount(initialBet);
    setHistory([]);
    setRecentResults([]);
    setPatternVerified(false);
    setVerificationCount(0);
    setCurrentBet(null);
    setConsecutiveLosses(0);
    setWins(0);
    setLosses(0);
    setIsPlaying(false);
  };
  
  const profit = bankroll - initialBankroll;
  const profitPct = ((profit / initialBankroll) * 100).toFixed(1);
  const totalBets = wins + losses;
  const winRate = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : 0;
  
  const statsData = [
    { name: 'Player', count: history.filter(h => h.winner === 'Player').length, fill: '#3b82f6' },
    { name: 'Banker', count: history.filter(h => h.winner === 'Banker').length, fill: '#ef4444' },
    { name: 'Tie', count: history.filter(h => h.winner === 'Tie').length, fill: '#10b981' },
    { name: 'Wins', count: wins, fill: '#8b5cf6' },
    { name: 'Losses', count: losses, fill: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-purple-500 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                🎰
              </div>
              <div>
                <h1 className="text-lg font-bold">Baccarat Strategy</h1>
                <p className="text-xs text-gray-400">Mobile Analyzer</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">⚙️ Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Initial Bankroll ($)</label>
                <input
                  type="number"
                  value={initialBankroll}
                  onChange={(e) => setInitialBankroll(Number(e.target.value))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  min="100"
                  step="100"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">Initial Bet ($)</label>
                <input
                  type="number"
                  value={initialBet}
                  onChange={(e) => setInitialBet(Number(e.target.value))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  min="1"
                  step="5"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">Speed (ms): {speed}</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowSettings(false);
                resetGame();
              }}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold"
            >
              Apply & Reset
            </button>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">⚡ Verification Status</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  Pattern verification requires 4 successful confirmations. 
                  Once verified, strategy betting becomes active.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Current Progress:</span>
                  <span className="text-lg font-bold text-purple-400">
                    {verificationCount} / 4
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">
                  Verification Count (0-4)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={verificationCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setVerificationCount(count);
                      setPatternVerified(count >= 4);
                    }}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold w-12 text-center text-purple-400">
                    {verificationCount}
                  </span>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Pattern Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    patternVerified 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-black'
                  }`}>
                    {patternVerified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-semibold">
                  Quick Actions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setVerificationCount(0);
                      setPatternVerified(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setVerificationCount(2);
                      setPatternVerified(false);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Half
                  </button>
                  <button
                    onClick={() => {
                      setVerificationCount(4);
                      setPatternVerified(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowVerifyModal(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold"
            >
              ✓ Done
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-4 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm opacity-90">💵 Bankroll</span>
            </div>
            <div className="text-2xl font-bold">${bankroll.toLocaleString()}</div>
            <div className={`text-sm ${profit >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {profit >= 0 ? '+' : ''}{profit.toLocaleString()} ({profitPct}%)
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm opacity-90">🎯 Current Bet</span>
            </div>
            <div className="text-2xl font-bold">${betAmount}</div>
            <div className="text-sm text-blue-200">
              {currentBet || 'Waiting...'}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm opacity-90">📈 Win Rate</span>
            </div>
            <div className="text-2xl font-bold">{winRate}%</div>
            <div className="text-sm text-purple-200">
              {wins}W / {losses}L
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setShowVerifyModal(true)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm opacity-90">⚡ Status</span>
              <span className="text-xs opacity-75">✏️</span>
            </div>
            <div className="text-sm font-bold">
              {patternVerified ? 'Active' : `Verify ${verificationCount}/4`}
            </div>
            <div className="text-xs text-orange-200">
              Losses: {consecutiveLosses}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold">📊 Enable Strategy Betting</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={useStrategy}
                onChange={(e) => setUseStrategy(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-14 h-7 rounded-full transition ${useStrategy ? 'bg-purple-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition m-1 ${useStrategy ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-gray-600 to-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            🔄 Reset
          </button>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-4">
          <h3 className="font-bold mb-3">📋 Recent Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentResults.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No results yet. Press Start to begin!
              </div>
            ) : (
              recentResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    result.winner === 'Player' ? 'bg-blue-500 bg-opacity-20' :
                    result.winner === 'Banker' ? 'bg-red-500 bg-opacity-20' :
                    'bg-green-500 bg-opacity-20'
                  }`}
                >
                  <div className="flex gap-4 font-mono">
                    <span>P:{result.playerScore}</span>
                    <span>B:{result.bankerScore}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{result.winner}</div>
                    <div className="text-xs opacity-70">{result.diffType}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-4">
          <h3 className="font-bold mb-3">📊 Game Statistics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {statsData.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="count" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BaccaratMobileApp;