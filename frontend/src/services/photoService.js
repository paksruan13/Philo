import { API_ROUTES } from './api';

export const photoService = {
    async uploadPhoto(file) {
        const token = localStorage.getItem('token');

        if(!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('file', file);

        try{
            const response = await fetch(API_ROUTES.photos.upload, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw new Error(`Photo upload failed: ${error.message}`);
        }
    }
};