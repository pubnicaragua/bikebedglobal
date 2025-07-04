import { supabase } from './supabase';
import { Database } from './supabase';

type Route = Database['public']['Tables']['routes'];
type RouteWithId = Database['public']['Tables']['routes']['Row'];

export const RoutesService = {
  async createRoute(routeData: Route) {
    const { data, error } = await supabase
      .from('routes')
      .insert(routeData)
      .select()
      .single();

    if (error) throw error;
    return data as RouteWithId;
  },

  async getRoutes() {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as RouteWithId[];
  },

  async getRouteById(id: string) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as RouteWithId;
  },

  async updateRoute(id: string, updates: Partial<Route>) {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RouteWithId;
  },

  async deleteRoute(id: string) {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async toggleRouteStatus(id: string, currentStatus: boolean) {
    return this.updateRoute(id, { is_active: !currentStatus });
  },
};