import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VotingPage() {

    const navigate = useNavigate();

    useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (!loggedIn) {
      navigate("/auth");
    }
  }, [navigate]);

  const [votes, setVotes] = useState({
    candidate1: 0,
    candidate2: 0
  });
  
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<keyof typeof candidates | null>(null);

  const candidates = {
    candidate1: {
      name: "Alex Johnson",
      party: "Progressive Party",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    candidate2: {
      name: "Sarah Miller", 
      party: "Unity Party",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    }
  };

const handleVote = (candidateKey: keyof typeof candidates) => {
    if (!hasVoted) {
      setVotes(prev => ({
        ...prev,
        [candidateKey]: prev[candidateKey] + 1
      }));
      setHasVoted(true);
      setSelectedCandidate(candidateKey);
      localStorage.clear();
    }
  };

  const resetVoting = () => {
    setVotes({ candidate1: 0, candidate2: 0 });
    setHasVoted(false);
    setSelectedCandidate(null);
  };

  const totalVotes = votes.candidate1 + votes.candidate2;
  const getPercentage = (candidateVotes: number) => {
  if (totalVotes === 0) return 0;
  return Math.round((candidateVotes / totalVotes) * 100);
};

  return (
    <div className="w-screen min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Election 2025
          </h1>
          <p className="text-lg text-gray-600">
            Cast your vote for the next leader
          </p>
        </div>

        {/* Voting Section */}
        {!hasVoted ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">
              Choose Your Candidate
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
                {(Object.entries(candidates) as [keyof typeof candidates, typeof candidates[keyof typeof candidates]][]).map(([key, candidate]) => (
                    <div
                        key={key}
                        onClick={() => handleVote(key)}
                        className={`
                    ${candidate.color} ${candidate.hoverColor}
                    text-white rounded-lg p-8 cursor-pointer
                    transform transition-all duration-200
                    hover:scale-105 hover:shadow-lg
                    active:scale-95
                  `}
                    >
                    <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">
                      {candidate.name}
                    </h3>
                    <p className="text-lg opacity-90 mb-4">
                      {candidate.party}
                    </p>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-2 rounded-full font-semibold transition-colors">
                      Vote Now
                    </button>
                  </div>
                    </div>
                    ))}
            </div>
          </div>
        ) : (
          /* Thank You Message */
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Thank You for Voting!
            </h2>
            <p className="text-gray-600 mb-4">
                <span className="font-semibold text-gray-800">
                    {selectedCandidate && candidates[selectedCandidate].name}
                </span>
            </p>
            
          </div>
        )}
      </div>
    </div>
  );
}