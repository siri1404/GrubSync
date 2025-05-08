import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Users, Plus, Copy } from 'lucide-react';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { JoinGroupModal } from '../components/JoinGroupModal';

interface Group {
  _id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export const Home: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/groups/my');
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load your groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchGroups();
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    fetchGroups();
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        toast.success('Invite code copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy invite code');
      });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Your Meal Groups</h1>
          <p className="text-neutral-600 mt-1">
            Coordinate meals with friends and get restaurant recommendations
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-outline flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Join Group
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card bg-white border border-neutral-200">
          <div className="card-body flex flex-col items-center py-12">
            <Users className="h-16 w-16 text-neutral-400 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">No Groups Yet</h3>
            <p className="text-neutral-600 text-center max-w-md mb-6">
              Create a new group or join an existing one using an invite code to start coordinating meals with friends.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create a Group
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-outline"
              >
                Join a Group
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group._id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="card-body">
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">{group.name}</h3>
                <div className="flex items-center text-sm text-neutral-500 mb-4">
                  <span className="bg-neutral-100 px-2 py-1 rounded flex items-center">
                    Code: {group.inviteCode}
                    <button 
                      onClick={() => copyInviteCode(group.inviteCode)}
                      className="ml-1 text-neutral-400 hover:text-neutral-700"
                      title="Copy invite code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <Link 
                  to={`/groups/${group._id}`}
                  className="btn-primary w-full text-center"
                >
                  View Group
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={handleCreateSuccess}
        />
      )}
      
      {showJoinModal && (
        <JoinGroupModal 
          onClose={() => setShowJoinModal(false)} 
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};