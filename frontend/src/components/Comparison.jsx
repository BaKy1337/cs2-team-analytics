export default function Comparison({ myTeam, enemyTeam }) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">⚔️ Comparaison des Équipes</h2>
        
        {/* Comparaison Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 shadow-xl">
            <div className="stat-title">Win Rate</div>
            <div className="stat-value text-sm">
              <span className={myTeam.avg_win_rate > enemyTeam.avg_win_rate ? 'text-success' : 'text-error'}>
                {myTeam.avg_win_rate.toFixed(1)}%
              </span>
              {' vs '}
              <span className={enemyTeam.avg_win_rate > myTeam.avg_win_rate ? 'text-success' : 'text-error'}>
                {enemyTeam.avg_win_rate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="stat bg-base-100 shadow-xl">
            <div className="stat-title">K/D Ratio</div>
            <div className="stat-value text-sm">
              <span className={myTeam.avg_kd > enemyTeam.avg_kd ? 'text-success' : 'text-error'}>
                {myTeam.avg_kd.toFixed(2)}
              </span>
              {' vs '}
              <span className={enemyTeam.avg_kd > myTeam.avg_kd ? 'text-success' : 'text-error'}>
                {enemyTeam.avg_kd.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="stat bg-base-100 shadow-xl">
            <div className="stat-title">ADR</div>
            <div className="stat-value text-sm">
              <span className={myTeam.avg_adr > enemyTeam.avg_adr ? 'text-success' : 'text-error'}>
                {myTeam.avg_adr.toFixed(0)}
              </span>
              {' vs '}
              <span className={enemyTeam.avg_adr > myTeam.avg_adr ? 'text-success' : 'text-error'}>
                {enemyTeam.avg_adr.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
  
        {/* Comparaison Maps */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Comparaison par Map</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Map</th>
                    <th>Notre WR</th>
                    <th>Leur WR</th>
                    <th>Avantage</th>
                  </tr>
                </thead>
                <tbody>
                  {myTeam.map_strengths.map((myMap) => {
                    const enemyMap = enemyTeam.map_strengths.find(m => m.map === myMap.map);
                    const diff = myMap.avg_win_rate - (enemyMap?.avg_win_rate || 0);
                    
                    return (
                      <tr key={myMap.map}>
                        <td className="font-bold">{myMap.map}</td>
                        <td>{myMap.avg_win_rate}%</td>
                        <td>{enemyMap?.avg_win_rate || 0}%</td>
                        <td>
                          <span className={`badge ${diff > 0 ? 'badge-success' : 'badge-error'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }