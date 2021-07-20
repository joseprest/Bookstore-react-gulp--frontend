import QuizzImage from '../../images/themes/vaudreuil/channel-quizz.svg';
import AnnouncementsImage from '../../images/themes/vaudreuil/channel-announcements.svg';
import EventsImage from '../../images/themes/vaudreuil/channel-events.svg';
import LocationsImage from '../../images/themes/vaudreuil/channel-locations.svg';

export default {
    id: 'vaudreuil',
    header_is_logo: true,
    header_background_color: '#fff',
    background_color: '#383a3c',
    button_background_color: '#5baed3',
    button_active_background_color: '#007dc0',
    channel_background_color: '#383a3c',
    channel_bubbles_background_color: '#000',
    channel_list_background_color: '#383a3c',
    bubble_suggestions_background_color: '#000',
    bubble_details_background_color: '#414142',
    keyboard_background_color: '#414142',
    list_item_active_background_color: '#5baed3',
    modal_background_color: '#5baed3',
    map_marker_color: '#5baed3',
    channels: {
        quizz: {
            image: process.env.NODE_ENV !== 'production' ? QuizzImage : '/vendor/manivelle-interface/images/themes/vaudreuil/channel-quizz.svg',
        },
        announcements: {
            image: process.env.NODE_ENV !== 'production' ? AnnouncementsImage : '/vendor/manivelle-interface/images/themes/vaudreuil/channel-announcements.svg',
        },
        locations: {
            image: process.env.NODE_ENV !== 'production' ? LocationsImage : '/vendor/manivelle-interface/images/themes/vaudreuil/channel-locations.svg',
        },
        events: {
            image: process.env.NODE_ENV !== 'production' ? EventsImage : '/vendor/manivelle-interface/images/themes/vaudreuil/channel-events.svg',
        },
    },
};
