import connection from '../database/connection';
import {Request, Response} from 'express';

class PointsController {
    async index(request: Request, response: Response) {
        const {city, uf, items} = request.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await connection('point')
            .join('point_item', 'point_item.point_id', '=', 'point.id')
            .whereIn('point_item.item_id', parsedItems)
            //.where('city', String(city))
            //.where('uf', String(uf))
            .distinct()
            .select('point.*');
        
        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.0.102:3333/uploads/${point.image}`
            };
        });

        return response.json(serializedPoints);
    }

    async show(request: Request, response: Response){
        const {id} = request.params;

        const point = await connection('point').select('*').where('id', id).first();

        if(!point){
            return response.status(400).json({ message: ' Point not found.' });
        }

        const serializedPoints = {   
            ...point,
            image_url: `http://192.168.0.102:3333/uploads/${point.image}`
        };

        const items = await connection('item')
            .join('point_item', 'item.id', '=', 'point_item.item_id')
            .where('point_item.point_id', id);
            //.select('item.title');

        return response.json({point: serializedPoints, items});
    }

    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude, 
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const trx = await connection.transaction(); 

        const point = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude, 
            longitude,
            city,
            uf
        };
    
        const ids = await trx('point').insert(point);

        const point_id = ids[0];
    
        const pointItems = items
            .split(',')
            .map((item: string) => Number(item.trim()))
            .map((item_id : number) => {
                return {
                item_id,
                point_id,
            }
        });
    
        await trx('point_item').insert(pointItems);

        await trx.commit(); 
    
        return response.json({ 
            id: point_id,
            ...point, 
         });
    }
}

export default PointsController; 