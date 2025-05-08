import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { X } from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/groups/create', { name: groupName });
      setInviteCode(response.data.group.inviteCode);
      toast.success('Group created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create group';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
        .then(() => {
          toast.success('Invite code copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          toast.error('Failed to copy invite code');
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-slide-in">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-neutral-800">
            {inviteCode ? 'Group Created!' : 'Create New Group'}
          </h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {inviteCode ? (
          <div className="p-6">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-600 mb-2">Share this invite code with friends:</p>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-neutral-800 mr-3">{inviteCode}</span>
                <button 
                  onClick={copyInviteCode}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={onSuccess}
                className="btn-primary w-full"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label htmlFor="groupName" className="block text-sm font-medium text-neutral-700 mb-1">
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input-field"
                placeholder="Weekend Dinner Group"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className={`btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};