import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { X } from 'lucide-react';

interface JoinGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post('/api/groups/join', { inviteCode });
      toast.success('Successfully joined the group!');
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to join group';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-slide-in">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-neutral-800">
            Join Existing Group
          </h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-neutral-700 mb-1">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="Enter 6-character code"
              maxLength={6}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-neutral-500">
              Enter the 6-character invite code you received from your friend.
            </p>
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
              {isSubmitting ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};