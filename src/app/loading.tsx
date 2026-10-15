import GamesSkeleton from '../components/app/GamesSkeleton';

export default function Loading() {
    return (
        <div style={{padding: '1rem', marginTop: '1rem'}}>
            <GamesSkeleton showDates />
        </div>
    );
}
